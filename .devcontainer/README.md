# Dev Container for GCDS Protospace

This directory contains configuration for a development container that provides a consistent development environment for working on the GCDS Protospace project.

## Features

- Node.js 18
- Hugo (latest)
- Git and other basic development tools
- VS Code extensions for working with Hugo, TOML, and Markdown files

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/)
- [VS Code Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening the Project in Dev Container

1. Open VS Code
2. Click the green "><" icon in the bottom-left corner
3. Select "Reopen in Container"
4. Wait for the container to build and initialize

### Running the Hugo Server

Once inside the dev container, you can start the Hugo server using one of these methods:

- **Using the start script**: Run `.devcontainer/start.sh` in the terminal
- **Using VS Code Tasks**: Press `Ctrl+Shift+B` or run the "Start Hugo Server" task
- **Manually**: Run `hugo server --bind=0.0.0.0 -D --baseURL=http://localhost:1313`

The site will be available at http://localhost:1313

### Building the Site

To build the site for production:

- Run the "Build Hugo Site" task from the VS Code Command Palette
- Or run `hugo --minify` in the terminal

## Customizing the Dev Container

You can modify the container configuration by editing the following files:

- `.devcontainer/devcontainer.json`: Dev container properties and VS Code settings
- `.devcontainer/Dockerfile`: Container image customization
- `.devcontainer/docker-compose.yml`: Container orchestration settings
