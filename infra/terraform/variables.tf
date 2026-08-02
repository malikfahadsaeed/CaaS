variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Name prefix applied to all resources"
  type        = string
  default     = "caas"
}

# --- Backend / Bedrock ---
variable "lambda_image_tag" {
  description = "ECR image tag the Lambda runs. CI updates the function code out-of-band, so image_uri drift is ignored after first apply."
  type        = string
  default     = "latest"
}

variable "bedrock_model_id" {
  description = "Bedrock foundation model id or cross-region inference profile id (must be available in bedrock_region and have model access enabled)"
  type        = string
  default     = "us.anthropic.claude-sonnet-4-20250514-v1:0"
}

variable "bedrock_region" {
  description = "Region used for Bedrock runtime calls"
  type        = string
  default     = "us-east-2"
}

variable "bedrock_max_tokens" {
  description = "Max output tokens per reply (kept modest to stay within the 30s API Gateway timeout)"
  type        = number
  default     = 512
}

variable "cors_origins" {
  description = "Comma-separated CORS origins for the backend. Empty is fine: the SPA and API are same-origin behind CloudFront, so no CORS is exercised."
  type        = string
  default     = ""
}

# --- CI/CD (GitHub OIDC) ---
variable "github_repo" {
  description = "GitHub repo (owner/name) allowed to assume the deploy role"
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set false if the account already has one."
  type        = bool
  default     = true
}
