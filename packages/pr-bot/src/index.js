require('dotenv').config();
const GCArticlesClient = require('./gcArticlesClient');
const { transformArticleToHugo } = require('./fetch-transform-content');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const WEBSITE_CONTENT_DIR = path.join(__dirname, '../../website');

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
 * Generates a unique translation key for a post
 * @param {Object} post - The post object
 * @returns {string} A unique translation key
 */
function generateTranslationKey(post) {
  // Use post ID or slug if available, or hash the title
  return post.id || 
         post.slug || 
         crypto.createHash('md5').update(post.title).digest('hex').slice(0, 8);
}

/**
 * Main function to process and save bilingual content
 */
async function main() {
  try {
    const client = new GCArticlesClient();
    console.log('Fetching bilingual posts from GC-Articles...');
    
    const { en: enPosts, fr: frPosts } = await client.getBilingualPosts();
    console.log(`Found ${enPosts.length} English posts and ${frPosts.length} French posts`);

    // Process and save all posts
    for (let i = 0; i < Math.max(enPosts.length, frPosts.length); i++) {
      const enPost = enPosts[i];
      const frPost = frPosts[i];
      
      if (enPost || frPost) {
        const translationKey = generateTranslationKey(enPost || frPost);

        // Process English post
        if (enPost) {
          console.log(`Processing English post: ${enPost.title}`);
          const { content, filePath } = transformArticleToHugo(enPost, 'en', translationKey);
          await saveContent(content, filePath);
        }

        // Process French post
        if (frPost) {
          console.log(`Processing French post: ${frPost.title}`);
          const { content, filePath } = transformArticleToHugo(frPost, 'fr', translationKey);
          await saveContent(content, filePath);
        }
      }
    }

    console.log('Successfully processed and saved all posts');
  } catch (error) {
    console.error('Application error:', error.message);
    process.exit(1);
  }
}

main();
