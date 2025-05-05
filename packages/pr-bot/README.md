# PR Bot Documentation

The PR Bot is designed to fetch content from GC-Articles and create pull requests to update the Hugo website.

## Features

- Fetches posts from the GC-Articles API
- Transforms GC-Articles content to Hugo-compatible Markdown
- Creates a pull request with updated content

## Configuration

### Environment Variables

Create a `.env` file in the `packages/pr-bot` directory with the following variables:

```
# GitHub configuration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=gcds-protospace

# GC-Articles API configuration
GC_ARTICLES_API_URL=https://your-wordpress-site.com/wp-json

# Content path (relative to repo root)
CONTENT_PATH=packages/website/content/en/posts
```

### GitHub Token

You'll need a GitHub personal access token with the following permissions:
- `repo` (Full control of private repositories)

## Development

### Setup

```bash
cd packages/pr-bot
npm install
```

### Running Locally

```bash
npm run dev
```

### Building

```bash
npm run build
```

## Deployment

The PR Bot can be deployed as:

1. A GitHub Action that runs on a schedule
2. A standalone server
3. A serverless function

### GitHub Action Setup

Create a workflow file at `.github/workflows/pr-bot.yml`:

```yaml
name: WordPress Content PR Bot

on:
  schedule:
    # Run every day at midnight
    - cron: '0 0 * * *'
  # Allow manual triggering
  workflow_dispatch:

jobs:
  fetch-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd packages/pr-bot
          npm ci
      
      - name: Run PR Bot
        env:
          GITHUB_TOKEN: ${{ secrets.PR_BOT_GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
          WORDPRESS_API_URL: ${{ secrets.WORDPRESS_API_URL }}
          CONTENT_PATH: packages/website/content/en/posts
        run: |
          cd packages/pr-bot
          npm start
```

## Troubleshooting

### GC-Articles API Connection Issues

If you're having trouble connecting to the GC-Articles API:

1. Ensure the API URL is correct
2. Check that the GC-Articles site has REST API enabled
3. Verify any authentication requirements

### GitHub API Issues

If you're having trouble with GitHub API operations:

1. Check that your token has the correct permissions
2. Ensure the token is not expired
3. Verify repository owner and name are correct
