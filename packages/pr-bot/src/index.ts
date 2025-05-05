import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Environment variables
const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  WORDPRESS_API_URL,
  CONTENT_PATH,
} = process.env;

// Check required environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !WORDPRESS_API_URL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

/**
 * Fetch posts from WordPress API
 */
async function fetchWordPressContent() {
  try {
    console.log(`Fetching content from: ${WORDPRESS_API_URL}/wp/v2/posts`);
    const response = await fetch(`${WORDPRESS_API_URL}/wp/v2/posts?_embed&per_page=10`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Error fetching WordPress content:', error);
    return [];
  }
}

/**
 * Transform WordPress post to Hugo markdown format
 */
function transformToHugoContent(post: any) {
  const title = post.title.rendered;
  const content = post.content.rendered;
  const date = new Date(post.date).toISOString();
  const slug = post.slug;
  
  // Generate frontmatter
  const frontmatter = `---
title: "${title}"
date: ${date}
draft: false
slug: "${slug}"
---

`;

  // Clean HTML content (simplified approach - might need more sophisticated parsing)
  const cleanedContent = content
    .replace(/<\/?[^>]+(>|$)/g, '') // Simple HTML tag removal
    .trim();

  return {
    slug,
    content: frontmatter + cleanedContent,
  };
}

/**
 * Create a PR with new content
 */
async function createPullRequest(content: { slug: string; content: string }[]) {
  try {
    // Get the latest commit on main branch
    const { data: refData } = await octokit.git.getRef({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      ref: 'heads/main',
    });
    
    const sha = refData.object.sha;
    const branchName = `update-content-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    // Create a new branch
    await octokit.git.createRef({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      ref: `refs/heads/${branchName}`,
      sha,
    });

    // Commit each content file
    for (const item of content) {
      const contentPath = `${CONTENT_PATH || 'packages/website/content/en/posts'}/${item.slug}.md`;
      
      // Check if file already exists
      try {
        await octokit.repos.getContent({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          path: contentPath,
          ref: branchName,
        });
        
        // File exists, update it
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          path: contentPath,
          message: `Update ${item.slug} content`,
          content: Buffer.from(item.content).toString('base64'),
          branch: branchName,
        });
        
        console.log(`Updated file: ${contentPath}`);
      } catch (error) {
        // File doesn't exist, create it
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          path: contentPath,
          message: `Add ${item.slug} content`,
          content: Buffer.from(item.content).toString('base64'),
          branch: branchName,
        });
        
        console.log(`Created file: ${contentPath}`);
      }
    }

    // Create pull request
    const { data: pullRequest } = await octokit.pulls.create({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      title: 'Update content from WordPress',
      head: branchName,
      base: 'main',
      body: 'Automatically generated PR with content updates from WordPress',
    });

    console.log(`Pull request created: ${pullRequest.html_url}`);
  } catch (error) {
    console.error('Error creating pull request:', error);
  }
}

/**
 * Main function to run the PR Bot
 */
async function main() {
  console.log('Starting PR Bot...');
  
  // Fetch content from WordPress
  const posts = await fetchWordPressContent();
  
  if (!posts || posts.length === 0) {
    console.log('No posts found.');
    return;
  }
  
  console.log(`Found ${posts.length} posts.`);
  
  // Transform posts to Hugo content
  const hugoContent = posts.map(transformToHugoContent);
  
  // Create a PR with the content
  await createPullRequest(hugoContent);
  
  console.log('PR Bot completed successfully.');
}

// Run the script
main().catch(console.error);
