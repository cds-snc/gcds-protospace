# Architecture Decision Record: Monorepo Structure

* Status: Accepted
* Date: 2025-05-05
* Deciders: Development Team

## Context

The GCDS Protospace project consists of multiple related components:
1. A Hugo website
2. A Hugo theme
3. A PR Bot for fetching content from WordPress

These components need to be maintained together and share some dependencies. We need to decide on the best repository structure to support efficient development, testing, and deployment of these components.

## Decision

We decided to implement a monorepo structure using npm workspaces to manage the three main components:

```
gcds-protospace/
├── package.json            # Root package.json with workspaces config
├── .github/                # GitHub Actions workflows 
├── packages/
│   ├── website/            # Hugo website
│   │   ├── package.json
│   │   ├── hugo.toml
│   │   └── content/
│   ├── theme/              # Hugo theme
│   │   ├── package.json
│   │   └── layouts/
│   └── pr-bot/             # WordPress content PR Bot
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
└── scripts/                # Shared scripts
```

## Rationale

### Benefits of the Monorepo Approach:

1. **Unified Development Experience**: 
   - One repository checkout for all related components
   - Simplified dependency management
   - Consistent tooling and standards

2. **Atomic Changes Across Components**:
   - Single PR can update website, theme, and bot components together
   - Keeps interdependent changes synchronized

3. **Simplified CI/CD**:
   - Unified testing and deployment pipelines
   - Ability to test components together

4. **Better Code Sharing**:
   - Shared utilities and components
   - Consistent styling and branding

5. **Centralized Issue Tracking**:
   - All component issues in one place
   - Better visibility of feature requests and bugs

### Why npm Workspaces:

- Native support in npm and yarn
- Lightweight compared to alternatives
- Optimizes installation by hoisting dependencies
- Enables cross-package development and testing

## Alternatives Considered

1. **Multiple Repositories**:
   - Would require more complex CI/CD setup
   - Synchronizing versions would be more challenging
   - Harder to make cross-cutting changes

2. **Lerna-based Monorepo**:
   - More complex setup
   - More suitable for publishing multiple packages

3. **Nx Workspace**:
   - More powerful but with steeper learning curve
   - Better suited for large Angular/React applications

## Consequences

### Positive:

- Simplified development workflow
- Better code organization
- Easier to make coordinated changes
- Shared tooling and configurations

### Negative:

- Repository becomes larger
- Git history can be more complex
- Onboarding may take longer for developers unfamiliar with monorepos
- May need to handle deployment separately for different components

## Implementation Strategy

1. Move existing Hugo website into packages/website
2. Move Hugo theme to packages/theme
3. Create new PR bot in packages/pr-bot
4. Set up GitHub Actions workflows for CI/CD
5. Establish shared scripts and utilities
6. Configure VS Code workspace for better developer experience
