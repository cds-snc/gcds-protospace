variable "s3_bucket_regional_domain_name" {
  description = "The regional domain names of the buckets that will be used as Cloudfront origin Id"
  type        = map(string)
}

variable "s3_buckets" {
  description = "EN and FR S3 Buckets"
  type        = map(any)
}

variable "billing_code" {
  description = "Billing code for cost tracking"
  type        = string
}

variable "product_name" {
  description = "Name of the product"
  type        = string
}

variable "website_domains" {
  description = "List of website domains"
  type        = list(string)
}

variable "cbs_satellite_bucket_name" {
  description = "Name of the CBS satellite bucket"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "buckets" {
  description = "Map of bucket names"
  type        = map(string)
}