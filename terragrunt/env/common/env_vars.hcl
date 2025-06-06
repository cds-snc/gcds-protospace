inputs = {
  account_id                = "730335533085"
  env                       = "production"
  billing_code              = "gcds-protospace"
  website_domains           = ["test.canada.ca/gcds-protospace/en", "test.canada.ca/gcds-protospace/fr"]
  cbs_satellite_bucket_name = "cbs-satellite-730335533085"
  region                    = "ca-central-1"
  product_name              = "digital-canada-website"
  buckets = {
    en = "gcds-protospace-website-en"
    fr = "gcds-protospace-website-fr"
  }
}
