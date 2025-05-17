require('dotenv').config();
const GCArticlesClient = require('./gcArticlesClient');

async function main() {
  try {
    const client = new GCArticlesClient();
    console.log('Fetching posts from GC-Articles...');
    const posts = await client.getPosts();
    console.log('Successfully fetched posts:', JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error('Application error:', error.message);
    process.exit(1);
  }
}

main();
