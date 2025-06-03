include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${dirname(find_in_parent_folders("env"))}/env/terragrunt.hcl"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/aws/cloudfront"
}

dependencies {
  paths = ["../s3"]
}

dependency "s3" {
  config_path = "../s3"

  mock_outputs = {
    bucket_regional_domain_name = {
      en = "mock-en-bucket.s3.ca-central-1.amazonaws.com"
      fr = "mock-fr-bucket.s3.ca-central-1.amazonaws.com"
    }
    s3_buckets = {
      en = { id = "mock-en-bucket" }
      fr = { id = "mock-fr-bucket" }
    }
  }
}
