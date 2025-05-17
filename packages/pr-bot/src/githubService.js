const { Octokit } = require('@octokit/rest');

class GitHubService {
  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    this.config = {
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main'
    };

    if (!this.config.owner || !this.config.repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }

    this.octokit = new Octokit({
      auth: token
    });
  }

  /**
   * Handles GitHub API errors and provides more specific error messages
   * @param {Error} error - The error from the GitHub API
   * @param {string} operation - The operation being performed
   * @returns {Error} A new error with a more specific message
   */
  handleGitHubError(error, operation) {
    if (error.status === 401) {
      return new Error(`Authentication failed during ${operation}. Please check your GITHUB_TOKEN.`);
    }
    if (error.status === 403) {
      if (error.message.includes('rate limit')) {
        return new Error(`Rate limit exceeded during ${operation}. Please try again later.`);
      }
      return new Error(`Permission denied during ${operation}. Please check your token's permissions.`);
    }
    if (error.status === 404) {
      return new Error(`Resource not found during ${operation}. Please check repository name and owner.`);
    }
    if (error.status === 422) {
      return new Error(`Validation failed during ${operation}. ${error.message}`);
    }
    return new Error(`Failed to ${operation}: ${error.message}`);
  }

  /**
   * Creates a new branch from the default branch
   * @param {string} branchName - Name of the new branch
   * @returns {Promise<string>} SHA of the new branch's HEAD
   */
  async createBranch(branchName) {
    try {
      // Get the SHA of the default branch
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.defaultBranch}`
      });

      // Create new branch
      await this.octokit.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
      });

      return ref.object.sha;
    } catch (error) {
      throw this.handleGitHubError(error, `create branch ${branchName}`);
    }
  }

  /**
   * Creates or updates files in the repository
   * @param {string} branch - Branch name
   * @param {Array<{path: string, content: string}>} files - Array of files to commit
   * @param {string} message - Commit message
   * @returns {Promise<string>} SHA of the new commit
   */
  async commitFiles(branch, files, message) {
    try {
      const commits = [];
      for (const file of files) {
        // Get the current file (if it exists) to get its SHA
        let fileSha;
        try {
          const { data: existingFile } = await this.octokit.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path: file.path,
            ref: branch
          });
          fileSha = existingFile.sha;
        } catch (error) {
          // File doesn't exist yet, which is fine
          if (error.status !== 404) {
            throw this.handleGitHubError(error, `check existence of ${file.path}`);
          }
        }

        // Create or update file
        const { data: commit } = await this.octokit.repos.createOrUpdateFileContents({
          owner: this.config.owner,
          repo: this.config.repo,
          path: file.path,
          message,
          content: Buffer.from(file.content).toString('base64'),
          branch,
          sha: fileSha
        });

        commits.push(commit);
      }

      return commits[commits.length - 1].commit.sha;
    } catch (error) {
      throw this.handleGitHubError(error, 'commit files');
    }
  }

  /**
   * Creates a pull request
   * @param {string} branch - Source branch name
   * @param {string} title - PR title
   * @param {string} body - PR description
   * @returns {Promise<number>} Pull request number
   */
  async createPullRequest(branch, title, body) {
    try {
      const { data: pr } = await this.octokit.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        head: branch,
        base: this.config.defaultBranch
      });

      return pr.number;
    } catch (error) {
      throw this.handleGitHubError(error, 'create pull request');
    }
  }

  /**
   * Closes all open auto-generated PRs
   * @param {string} prTitlePrefix - The prefix to identify auto-generated PRs
   * @returns {Promise<void>}
   */
  async closeAutoPRs(prTitlePrefix = 'Content: Sync from GC-Articles') {
    try {
      const { data: prs } = await this.octokit.pulls.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open'
      });

      for (const pr of prs) {
        if (pr.title.startsWith(prTitlePrefix)) {
          await this.octokit.pulls.update({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: pr.number,
            state: 'closed'
          });

          // Delete the branch
          await this.octokit.git.deleteRef({
            owner: this.config.owner,
            repo: this.config.repo,
            ref: `heads/${pr.head.ref}`
          });
        }
      }
    } catch (error) {
      throw this.handleGitHubError(error, 'close auto PRs');
    }
  }

  /**
   * Helper method to generate a unique branch name
   * @param {string} prefix - Branch name prefix
   * @returns {string} Unique branch name
   */
  generateBranchName(prefix = 'content-update') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}`;
  }
}

module.exports = GitHubService;
