module "website" {
  source = "github.com/cds-snc/terraform-modules//simple_static_website?ref=v10.4.7"

  domain_name_source = var.website_domain
  billing_tag_value  = var.billing_code
  hosted_zone_id    = aws_route53_zone.gcds_protospace.zone_id

  providers = {
    aws           = aws
    aws.dns       = aws
    aws.us-east-1 = aws.us-east-1
  }
}