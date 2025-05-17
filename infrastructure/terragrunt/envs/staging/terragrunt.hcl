terraform {
  source = "${get_repo_root()}/infrastructure/terragrunt/aws/s3"
}

inputs = {
  bucket_name = "gcds-protospace-staging-content"
  enable_versioning = true
  
  tags = {
    Environment = "staging"
    Project     = "gcds-protospace"
  }
}