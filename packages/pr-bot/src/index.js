import 'dotenv/config';
import { GCArticlesClient } from './gcArticlesClient.js';
import { GitHubService } from './githubService.js';
import { transformArticleToHugo } from './fetch-transform-content.js';
import { ContentValidator } from './utils/contentValidator.js';
import { ContentHashStore } from './utils/contentHashStore.js';
import { logger } from './utils/logger.js';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

// Initialize services
const client = new GCArticlesClient();
const githubService = new GitHubService();
const validator = new ContentValidator();
const hashStore = new ContentHashStore();

const WEBSITE_CONTENT_DIR = path.join(new URL('../../website', import.meta.url).pathname);

/**
 * Ensures the directory exists, creates it if it doesn't
 * @param {string} dir - Directory path
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Saves the transformed content to a file
 * @param {string} content - The content to save
 * @param {string} filePath - The relative path where to save the file
 */
async function saveContent(content, filePath) {
  const fullPath = path.join(WEBSITE_CONTENT_DIR, filePath);
  const dir = path.dirname(fullPath);
  await ensureDir(dir);
  await fs.writeFile(fullPath, content);
}

/**
 * Main workflow function
 */
async function main() {
  try {
    logger.info('Starting PR Bot workflow');
    
    // Load content hashes
    await hashStore.load();
    
    // Step 1: Close existing auto-PRs
    await logger.timeOperation('close-auto-prs', async () => {
      await githubService.closeAutoPRs();
      logger.info('Closed existing automated PRs');
    });

    // Step 2: Fetch bilingual content
    const { en: enPosts, fr: frPosts } = await logger.timeOperation(
      'fetch-content',
      () => client.getBilingualPosts()
    );

    if (!enPosts.length && !frPosts.length) {
      logger.info('No content found to process');
      return;
    }

    logger.info('Retrieved content', {
      englishPosts: enPosts.length,
      frenchPosts: frPosts.length
    });

    // Step 3: Create a new branch for changes
    const branchName = githubService.generateBranchName('content-sync');
    await githubService.createBranch(branchName);
    logger.info('Created new branch', { branchName });

    // Step 4: Process content
    const processedFiles = [];
    const changedFiles = new Set();

    // Process English and French content in pairs
    for (let i = 0; i < Math.max(enPosts.length, frPosts.length); i++) {
      const enPost = enPosts[i];
      const frPost = frPosts[i];
      
      if (!enPost && !frPost) continue;

      const translationKey = generateTranslationKey(enPost || frPost);

      // Process English content
      if (enPost) {
        console.log(`Processing English post: ${enPost.title}`);
        const processed = await processContent(enPost, 'en', translationKey);
        if (processed) {
          await saveContent(processed.content, processed.filePath);
          processedFiles.push(processed);
          changedFiles.add(processed.filePath);
        }
      }

      // Process French content
      if (frPost) {
        console.log(`Processing French post: ${frPost.title}`);
        const processed = await processContent(frPost, 'fr', translationKey);
        if (processed) {
          await saveContent(processed.content, processed.filePath);
          processedFiles.push(processed);
          changedFiles.add(processed.filePath);
        }
      }
    }

    // Step 5: Create PR if there are changes
    if (processedFiles.length > 0) {
      const commitMessage = 'Content: Update from GC-Articles';
      const commitSha = await githubService.commitFiles(branchName, processedFiles, commitMessage);

      // Generate PR description
      const prBody = generatePRDescription(processedFiles);
      const prTitle = `Content Sync: ${new Date().toISOString().split('T')[0]}`;

      const prNumber = await githubService.createPullRequest(
        branchName,
        prTitle,
        prBody
      );

      logger.info('Created pull request', {
        number: prNumber,
        changedFiles: changedFiles.size
      });
    } else {
      logger.info('No content changes detected, cleaning up branch');
      await githubService.deleteRef(branchName);
    }

    // Save updated content hashes
    await hashStore.save();
    logger.info('PR Bot workflow completed successfully');

  } catch (error) {
    logger.error('PR Bot workflow failed', error);
    throw error;
  }
}

/**
 * Process a single content item
 */
async function processContent(post, lang, translationKey) {
  try {
    const { content, filePath } = transformArticleToHugo(post, lang, translationKey);
    
    // Validate content
    if (!validator.validateContent(content, filePath)) {
      logger.error('Content validation failed', null, {
        errors: validator.getErrors(),
        postId: post.id,
        filePath
      });
      return null;
    }

    // Check if content has changed
    if (!hashStore.hasChanged(post.id, content)) {
      logger.info('Content unchanged, skipping', {
        postId: post.id,
        filePath
      });
      return null;
    }

    // Update hash and return processed content
    hashStore.updateHash(post.id, content);
    return { content, filePath };

  } catch (error) {
    logger.error('Content processing failed', error, {
      postId: post.id,
      lang
    });
    return null;
  }
}

/**
 * Generate a unique translation key for content
 */
function generateTranslationKey(post) {
  return post.id || 
         post.slug || 
         crypto.createHash('md5')
           .update(post.title)
           .digest('hex')
           .slice(0, 8);
}

/**
 * Generate PR description with summary of changes
 */
function generatePRDescription(files) {
  const changedFiles = files.length;
  const timestamp = new Date().toISOString();
  
  let description = `## Content Update Summary\n\n`;
  description += `🔄 ${changedFiles} file(s) updated\n`;
  description += `⏰ Updated at: ${timestamp}\n\n`;
  description += `### Changed Files\n`;
  
  // List changed files grouped by language
  const enFiles = files.filter(f => f.filePath.includes('/en/'));
  const frFiles = files.filter(f => f.filePath.includes('/fr/'));
  
  if (enFiles.length) {
    description += '\n🇬🇧 English Content:\n';
    enFiles.forEach(f => description += `- \`${f.filePath}\`\n`);
  }
  
  if (frFiles.length) {
    description += '\n🇫🇷 French Content:\n';
    frFiles.forEach(f => description += `- \`${f.filePath}\`\n`);
  }
  
  return description;
}

// Run the workflow
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
