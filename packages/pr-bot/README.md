# PR Bot

A bot for managing GC-Articles content synchronization with automated pull requests.

## Features

- Fetches content from GC-Articles API
- Transforms content into Hugo-compatible Markdown files
- Creates automated pull requests with content updates
- Supports bilingual content (English and French)

## Requirements

- Node.js >= 18.0.0
- GitHub Personal Access Token with appropriate permissions

## Configuration

The following environment variables are required:

### GC-Articles API Configuration
- `GC_ARTICLES_API_URL`: The base URL for the GC-Articles API
- `GC_ARTICLES_API_USERNAME`: Username for API authentication
- `GC_ARTICLES_API_PASSWORD`: Password for API authentication

### GitHub Configuration
- `GITHUB_TOKEN`: GitHub Personal Access Token for creating branches and pull requests
- `GITHUB_OWNER`: The owner of the target repository (username or organization)
- `GITHUB_REPO`: The name of the target repository
- `GITHUB_DEFAULT_BRANCH`: (Optional) The default branch to create PRs against (defaults to 'main')

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your configuration values

3. Run the bot:
   ```bash
   npm start
   ```

   Or for development with automatic environment variable loading:
   ```bash
   npm run dev
   ```

## Development

The bot consists of several modules:

- `src/index.js`: Main entry point and orchestration
- `src/gcArticlesClient.js`: Client for interacting with GC-Articles API
- `src/githubService.js`: Service for GitHub API interactions
- `src/fetch-transform-content.js`: Content transformation utilities

## License
## License

MIT License

Copyright (c) 2025 Canadian Digital Service

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
