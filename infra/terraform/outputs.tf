output "public_ip" {
  description = "Static Elastic IP of the instance"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "Convenience SSH command"
  value       = "ssh ec2-user@${aws_eip.app.public_ip}"
}

output "site_url" {
  description = "Public URL once DNS is pointed at the Elastic IP"
  value       = "https://${var.domain_name}"
}

output "dns_setup_hint" {
  description = "DNS record to create"
  value       = "Create an A record: ${var.domain_name} -> ${aws_eip.app.public_ip}"
}
