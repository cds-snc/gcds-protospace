import { Octokit } from '@octokit/rest';
import { logger } from './utils/logger';

class GitHubService {
  constructor() {
    const {
      GITHUB_TOKEN: token,
      GITHUB_OWNER: owner,
      GITHUB_REPO: repo,
      GITHUB_DEFAULT_BRANCH: defaultBranch = 'main'
    } = process.env;

    if (!token || !owner || !repo) {
      throw new Error('Missing required GitHub configuration');
    }

    this.config = { owner, repo, defaultBranch };
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Create a new branch from the default branch
   */
  async createBranch(branchName) {
    try {
      logger.info('Creating new branch', { branchName });

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
      this.handleError('Failed to create branch', error);
    }
  }

  /**
   * Delete a branch
   */
  async deleteRef(branchName) {
    try {
      await this.octokit.git.deleteRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branchName}`
      });

      logger.info('Deleted branch', { branchName });
    } catch (error) {
      this.handleError('Failed to delete branch', error);
    }
  }

  /**
   * Create or update files in the repository
   */
  async commitFiles(branch, files, message) {
    try {
      const commits = [];
      
      for (const file of files) {
        // Get current file (if exists) to get its SHA
        let fileSha;
        try {
          const { data: existingFile } = await this.octokit.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path: file.filePath,
            ref: branch
          });
          fileSha = existingFile.sha;
        } catch (error) {
          // File doesn't exist yet, which is fine
          if (error.status !== 404) {
            throw error;
          }
        }

        // Create or update file
        const { data: commit } = await this.octokit.repos.createOrUpdateFileContents({
          owner: this.config.owner,
          repo: this.config.repo,
          path: file.filePath,
          message,
          content: Buffer.from(file.content).toString('base64'),
          branch,
          sha: fileSha
        });

        commits.push(commit);
        logger.info('Committed file', {
          path: file.filePath,
          sha: commit.commit.sha
        });
      }

      return commits[commits.length - 1].commit.sha;
    } catch (error) {
      this.handleError('Failed to commit files', error);
    }
  }

  /**
   * Create a pull request
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

      logger.info('Created pull request', {
        number: pr.number,
        url: pr.html_url
      });

      return pr.number;
    } catch (error) {
      this.handleError('Failed to create pull request', error);
    }
  }

  /**
   * Close all existing automated PRs
   */
  async closeAutoPRs(prTitlePrefix = 'Content Sync:') {
    try {
      const { data: prs } = await this.octokit.pulls.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open'
      });

      for (const pr of prs) {
        if (pr.title.startsWith(prTitlePrefix)) {
          // Close the PR
          await this.octokit.pulls.update({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: pr.number,
            state: 'closed'
          });

          // Delete the branch
          if (pr.head && pr.head.ref) {
            await this.deleteRef(pr.head.ref);
          }

          logger.info('Closed automated PR', {
            number: pr.number,
            branch: pr.head.ref
          });
        }
      }
    } catch (error) {
      this.handleError('Failed to close automated PRs', error);
    }
  }

  /**
   * Generate a unique branch name
   */
  generateBranchName(prefix = 'content-sync') {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .split('-')
      .slice(0, 4)
      .join('-');
    return `${prefix}-${timestamp}`;
  }

  /**
   * Handle GitHub API errors with proper logging
   */
  handleError(message, error) {
    let enhancedMessage = message;
    
    if (error.status === 401) {
      enhancedMessage = `${message}: Authentication failed. Check your GITHUB_TOKEN.`;
    } else if (error.status === 403) {
      if (error.message.includes('rate limit')) {
        enhancedMessage = `${message}: Rate limit exceeded. Please try again later.`;
      } else {
        enhancedMessage = `${message}: Permission denied. Check your token's permissions.`;
      }
    } else if (error.status === 404) {
      enhancedMessage = `${message}: Resource not found. Check repository name and owner.`;
    } else if (error.status === 422) {
      enhancedMessage = `${message}: Validation failed. ${error.message}`;
    }

    logger.error(enhancedMessage, error, {
      status: error.status,
      message: error.message
    });

    throw new Error(enhancedMessage);
  }
}

export { GitHubService };
