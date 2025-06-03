include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${dirname(find_in_parent_folders("env"))}/env/terragrunt.hcl"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/aws/hosted_zone"
}

inputs = {
  billing_code = dependency.env_vars.outputs.billing_code
}

dependency "env_vars" {
  config_path = "${dirname(find_in_parent_folders("env"))}/env"
  
  mock_outputs = {
    billing_code = "mock-billing-code"
  }
}
