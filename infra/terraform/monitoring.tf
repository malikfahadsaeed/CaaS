# =====================================================================
# Monitoring & alerting: CloudWatch alarms -> SNS -> email
#
# Alarms notify an SNS topic; an email subscription fans them out. All
# alarms use count/window thresholds (not single events) to avoid alert
# fatigue, and treat missing data as "not breaching" so a quiet app with
# no traffic stays green instead of alarming on absent metrics.
# =====================================================================

locals {
  # Alarm thresholds. Count-based (not rate-based) on purpose: at low
  # traffic a percentage rate divides by tiny numbers and gets noisy, so a
  # raw count over a 5-minute window is the more stable signal here.
  alarm_period          = 300   # seconds (5 min)
  bedrock_failure_count = 3     # swallowed Bedrock errors per window
  apigw_5xx_count       = 5     # backend 5xx responses per window
  lambda_error_count    = 3     # unhandled Lambda errors per window
  lambda_throttle_count = 1     # any throttle is worth knowing
  lambda_duration_p95   = 25000 # ms; warn before the 29s timeout cap
}

resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
  tags = local.tags
}

# Email delivery requires a one-time confirmation: AWS emails a link to
# var.alert_email that must be clicked before any alarm can be delivered.
resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------------------------------------------------------------------
# Bedrock failures — the alarm CloudWatch can't give us for free.
#
# chat_service.py catches Bedrock errors and returns a friendly fallback,
# so a Bedrock outage produces ZERO Lambda errors and ZERO 5xx. The only
# signal is the `logger.exception("Bedrock converse call failed")` line,
# which this metric filter turns into an alarmable metric.
#
# NOTE: this manages the Lambda log group. If the function has already run
# once, AWS auto-created the group and the first apply will report it as
# existing — import it once:
#   terraform import aws_cloudwatch_log_group.backend /aws/lambda/caas-backend
# ---------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/lambda/${aws_lambda_function.backend.function_name}"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_cloudwatch_log_metric_filter" "bedrock_failures" {
  name           = "${local.name}-bedrock-failures"
  log_group_name = aws_cloudwatch_log_group.backend.name
  pattern        = "\"Bedrock converse call failed\""

  metric_transformation {
    name          = "BedrockFailures"
    namespace     = "CaaS/Backend"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "bedrock_failures" {
  alarm_name          = "${local.name}-bedrock-failures"
  alarm_description   = "Bedrock converse calls are failing (users are getting the fallback reply)."
  namespace           = "CaaS/Backend"
  metric_name         = "BedrockFailures"
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = local.bedrock_failure_count
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = local.tags
}

# ---------------------------------------------------------------------
# API Gateway 5xx — real backend breakage reaching clients.
# ---------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "${local.name}-apigw-5xx"
  alarm_description   = "API Gateway is returning 5xx responses."
  namespace           = "AWS/ApiGateway"
  metric_name         = "5xx"
  dimensions          = { ApiId = aws_apigatewayv2_api.http.id }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = local.apigw_5xx_count
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = local.tags
}

# ---------------------------------------------------------------------
# Lambda unhandled errors — crashes/exceptions that escape the handler.
# ---------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name}-lambda-errors"
  alarm_description   = "Backend Lambda is throwing unhandled errors."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.backend.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = local.lambda_error_count
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = local.tags
}

# ---------------------------------------------------------------------
# Lambda throttles — hitting the concurrency ceiling.
# ---------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.name}-lambda-throttles"
  alarm_description   = "Backend Lambda invocations are being throttled."
  namespace           = "AWS/Lambda"
  metric_name         = "Throttles"
  dimensions          = { FunctionName = aws_lambda_function.backend.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = local.lambda_throttle_count
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = local.tags
}

# ---------------------------------------------------------------------
# Lambda duration (p95) — early warning before requests hit the 29s cap.
# ---------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.name}-lambda-duration"
  alarm_description   = "Backend Lambda p95 duration is approaching the 29s timeout."
  namespace           = "AWS/Lambda"
  metric_name         = "Duration"
  dimensions          = { FunctionName = aws_lambda_function.backend.function_name }
  extended_statistic  = "p95"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = local.lambda_duration_p95
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = local.tags
}
