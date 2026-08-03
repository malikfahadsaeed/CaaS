output "site_url" {
  description = "Public HTTPS URL of the app (CloudFront default domain)"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id (used by CI to invalidate the cache)"
  value       = aws_cloudfront_distribution.cdn.id
}

output "api_invoke_url" {
  description = "API Gateway HTTP API base URL (direct; normally reached via CloudFront /api/*)"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "s3_bucket_name" {
  description = "Frontend static-site bucket"
  value       = aws_s3_bucket.frontend.bucket
}

output "ecr_repository_url" {
  description = "ECR repository for the backend Lambda image"
  value       = aws_ecr_repository.backend.repository_url
}

output "lambda_function_name" {
  description = "Backend Lambda function name (used by CI to update code)"
  value       = aws_lambda_function.backend.function_name
}

output "gha_deploy_role_arn" {
  description = "IAM role GitHub Actions assumes via OIDC to deploy"
  value       = aws_iam_role.gha_deploy.arn
}

output "alerts_topic_arn" {
  description = "SNS topic that CloudWatch alarms publish to (subscribe more endpoints here)"
  value       = aws_sns_topic.alerts.arn
}
