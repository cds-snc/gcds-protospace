include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${dirname(find_in_parent_folders("env"))}/env/terragrunt.hcl"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/aws/s3"
}
