import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Import content processing functions
const processBilingualContent = require('./fetch-transform-content');

dotenv.config();

// Environment variables
const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  CONTENT_PATH,
  GC_ARTICLES_API_URL,
} = process.env;

// Check required environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GC_ARTICLES_API_URL) {
  console.error('Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GC_ARTICLES_API_URL');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

/**
 * Close any existing automated PRs
 */
async function closeExistingPRs(): Promise<void> {
  try {
    console.log('Checking for existing automated PRs...');
    
    const { data: prs } = await octokit.pulls.list({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      state: 'open',
    });

    for (const pr of prs) {
      if (pr.title.startsWith('[AUTO-PR]') || pr.title.startsWith('[ AUTO-PR ]')) {
        console.log(`Closing PR #${pr.number}: ${pr.title}`);
        
        // Close the PR
        await octokit.pulls.update({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          pull_number: pr.number,
          state: 'closed',
        });

        // Delete the branch
        if (pr.head && pr.head.ref) {
          try {
            await octokit.git.deleteRef({
              owner: GITHUB_OWNER!,
              repo: GITHUB_REPO!,
              ref: `heads/${pr.head.ref}`,
            });
            console.log(`Deleted branch: ${pr.head.ref}`);
          } catch (error) {
            console.warn(`Failed to delete branch ${pr.head.ref}:`, error);
          }
        }
      }
    }
    
    console.log('Completed checking and closing automated PRs');
  } catch (error) {
    console.error('Error closing existing PRs:', error);
    throw error;
  }
}

/**
 * Get bilingual content from GC Articles
 */
async function fetchBilingualContent(): Promise<any[]> {
  try {
    console.log('Fetching bilingual content from GC Articles...');
    return await processBilingualContent();
  } catch (error) {
    console.error('Error fetching bilingual content:', error);
    throw error;
  }
}

/**
 * Create a PR with new content
 */
async function createPullRequest(content: { fileName: string; body: string; slug: string }[]): Promise<string | null> {
  try {
    console.log('Creating new pull request with content...');
    
    // Get the latest commit on main branch
    const { data: refData } = await octokit.git.getRef({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      ref: 'heads/main',
    });
    
    const sha = refData.object.sha;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `content-release-${timestamp}`;

    // Create a new branch
    console.log(`Creating new branch: ${branchName}`);
    await octokit.git.createRef({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      ref: `refs/heads/${branchName}`,
      sha,
    });

    let hasChanges = false;
    
    // Commit each content file
    for (const item of content) {
      // Determine file path in repo
      const basePath = CONTENT_PATH || 'content';
      const contentPath = `${basePath}/${item.fileName}`;
      
      // Check if file already exists
      try {
        const { data: existingFile } = await octokit.repos.getContent({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          path: contentPath,
          ref: branchName,
        });
        
        // Check if content has changed (decode Base64 content)
        let existingContent = '';
        if ('content' in existingFile && existingFile.content) {
          existingContent = Buffer.from(existingFile.content, 'base64').toString('utf-8');
        }
        
        if (existingContent !== item.body) {
          // File exists but content changed, update it
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER!,
            repo: GITHUB_REPO!,
            path: contentPath,
            message: `Update ${path.basename(item.fileName)}`,
            content: Buffer.from(item.body).toString('base64'),
            sha: 'sha' in existingFile ? existingFile.sha : '',
            branch: branchName,
          });
          
          console.log(`Updated file: ${contentPath}`);
          hasChanges = true;
        } else {
          console.log(`No changes for: ${contentPath}`);
        }
      } catch (error: any) {
        if (error.status === 404) {
          // File doesn't exist, create it
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER!,
            repo: GITHUB_REPO!,
            path: contentPath,
            message: `Add ${path.basename(item.fileName)}`,
            content: Buffer.from(item.body).toString('base64'),
            branch: branchName,
          });
          
          console.log(`Created file: ${contentPath}`);
          hasChanges = true;
        } else {
          throw error;
        }
      }
    }

    // Only create PR if there are changes
    if (hasChanges) {
      // Create pull request
      const { data: pullRequest } = await octokit.pulls.create({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        title: `[ AUTO-PR ] New content release - ${new Date().toISOString()}`,
        head: branchName,
        base: 'main',
        body: 'New Content release for CDS Website. See below commits for list of changes.',
      });

      console.log(`Pull request created: ${pullRequest.html_url}`);
      return branchName;
    } else {
      // No changes, delete the branch
      console.log('No changes detected, deleting branch...');
      await octokit.git.deleteRef({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        ref: `heads/${branchName}`,
      });
      return null;
    }
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw error;
  }
}

/**
 * Process content using process_bilingual_articles.js
 */
async function processBilingualArticles(branchName: string | null): Promise<void> {
  try {
    if (!branchName) {
      console.log('No PR created, skipping bilingual articles processing');
      return;
    }
    
    console.log('Processing bilingual articles...');
    
    // Execute process_bilingual_articles.js
    const scriptPath = path.resolve(__dirname, 'process_bilingual_articles.js');
    
    // Add BRANCH_NAME to environment variables to allow the script to know which branch to commit to
    const env = {
      ...process.env,
      BRANCH_NAME: branchName,
      GITHUB_OWNER: GITHUB_OWNER,
      GITHUB_REPO: GITHUB_REPO,
      GITHUB_TOKEN: GITHUB_TOKEN
    };
    
    // Execute the script
    execSync(`node ${scriptPath}`, { 
      env: env,
      stdio: 'inherit' 
    });
    
    console.log('Successfully processed bilingual articles');
  } catch (error) {
    console.error('Error processing bilingual articles:', error);
    throw error;
  }
}

/**
 * Main function to run the PR Bot
 */
async function main() {
  try {
    console.log('Starting PR Bot...');
    
    // Close any existing automated PRs
    await closeExistingPRs();
    
    // Fetch content from GC Articles
    const content = await fetchBilingualContent();
    
    if (!content || content.length === 0) {
      console.log('No content found.');
      return;
    }
    
    console.log(`Found ${content.length} content items.`);
    
    // Create a PR with the content
    const branchName = await createPullRequest(content);
    
    // Process bilingual articles if PR was created
    await processBilingualArticles(branchName);
    
    console.log('PR Bot completed successfully.');
  } catch (error) {
    console.error('PR Bot encountered an error:', error);
    process.exit(1);
  }
}

// Run the script
main();
