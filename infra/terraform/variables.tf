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

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "domain_name" {
  description = "Domain for the app. An A record for this name must point to the Elastic IP; Caddy uses it for Let's Encrypt."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR permitted to SSH (use your.ip/32 — never 0.0.0.0/0)"
  type        = string
}

variable "public_key_path" {
  description = "Path to the SSH public key installed on the instance"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "image_owner" {
  description = "GitHub owner/org whose ghcr.io images are pulled (lowercase)"
  type        = string
}

variable "image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}
