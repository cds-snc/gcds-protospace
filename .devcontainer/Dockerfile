FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install basic development tools
RUN apt-get update && apt-get install -y \
    zsh \
    git \
    curl \
    wget \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install Hugo extended (we're using the Hugo feature, but being explicit here)
# Note: This is redundant with the feature in devcontainer.json, 
# but included here for completeness if you want to customize further
# ARG HUGO_VERSION=0.119.0
# RUN wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
#    && dpkg -i hugo.deb \
#    && rm hugo.deb

# [Optional] Set the default user. Omit if you want to keep the default user
USER node

# Set working directory
WORKDIR /workspace
