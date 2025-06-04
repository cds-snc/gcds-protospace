locals {
  vars         = read_terragrunt_config("./env_vars.hcl")
}

inputs = {
  account_id                = local.vars.inputs.account_id
  website_domain            = local.vars.inputs.website_domain
  env                       = local.vars.inputs.env
  region                    = local.vars.inputs.region
  billing_code              = local.vars.inputs.billing_code
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    encrypt             = true
    bucket              = "${local.vars.inputs.billing_code}-${local.vars.inputs.env}-tf"
    use_lockfile        = true
    region              = local.vars.inputs.region
    key                 = "./terraform.tfstate"
    s3_bucket_tags      = { CostCenter : local.vars.inputs.billing_code }
    dynamodb_table_tags = { CostCenter : local.vars.inputs.billing_code }
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = file("./common/provider.tf")
}

generate "common_variables" {
  path      = "common_variables.tf"
  if_exists = "overwrite"
  contents  = file("./common/common_variables.tf")
}