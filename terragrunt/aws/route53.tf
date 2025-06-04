resource "aws_route53_zone" "gcds_protospace" {
  name = var.website_domain
  tags = {
    CostCentre = var.billing_code
    Terraform  = true
  }
}