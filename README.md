# GCDS Protospace Monorepo

An open-source prototyping space on GitHub will let us experiment with the GC Design System (GCDS) in a way that's fast, secure, and fully aligned with Government of Canada Digital Standards.

## Monorepo Structure

This repository is organized as a monorepo containing three main packages:

- **Website** (`packages/website`): The Hugo website that serves as the front-end of GCDS Protospace
- **Theme** (`packages/theme`): The Hugo theme for GCDS Protospace
- **PR Bot** (`packages/pr-bot`): A bot that fetches content from a headless WordPress instance

## Development

### Prerequisites

- Node.js (v18 or later)
- Hugo (extended version)
- Git

### Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/gcds-protospace.git
   cd gcds-protospace
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev:website
   ```

4. To run the PR bot (after configuring environment variables)
   ```bash
   npm run dev:pr-bot
   ```

## Building for Production

```bash
npm run build
```gcds-protospace
An open-source prototyping space on GitHub will let us experiment with the GC Design System (GCDS) in a way that’s fast, secure, and fully aligned with Government of Canada Digital Standards.
