variable "account_id" {
  description = "(Required) The account ID to perform actions on."
  type        = string
}

variable "billing_code" {
  description = "The billing code to tag our resources with"
  type        = string
}

variable "website_domain" {
  description = "The domain to use for the service."
  type        = string
}

variable "env" {
  description = "The current running environment"
  type        = string
}

variable "region" {
  description = "The current AWS region"
  type        = string
}
