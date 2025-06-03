include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${dirname(find_in_parent_folders("env"))}/env/terragrunt.hcl"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/aws/ecr"
}

inputs = {
  region     = dependency.env_vars.outputs.region
  account_id = dependency.env_vars.outputs.account_id
}

dependency "env_vars" {
  config_path = "${dirname(find_in_parent_folders("env"))}/env"
  
  mock_outputs = {
    region     = "ca-central-1"
    account_id = "123456789012"
  }
}
