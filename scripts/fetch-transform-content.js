#!/usr/bin/env node

/**
 * This utility script demonstrates how to transform WordPress content 
 * to a format compatible with your Hugo site.
 * 
 * Usage:
 * 1. Save as a script file e.g. scripts/transform-content.js
 * 2. Make executable: chmod +x scripts/transform-content.js
 * 3. Run: ./scripts/transform-content.js path/to/wordpress-content.json
 */

const fs = require('fs').promises;
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../packages/website/content');

/**
 * Transform WordPress post to Hugo markdown
 */
function transformToHugoContent(post) {
  const title = post.title.rendered.replace(/"/g, '\\"');
  const content = post.content.rendered;
  const date = new Date(post.date).toISOString();
  const slug = post.slug;
  
  // Extract categories and tags
  const categories = post._embedded && 
    post._embedded['wp:term'] && 
    post._embedded['wp:term'][0] ? 
    post._embedded['wp:term'][0].map(cat => cat.name) : [];
  
  const tags = post._embedded && 
    post._embedded['wp:term'] && 
    post._embedded['wp:term'][1] ? 
    post._embedded['wp:term'][1].map(tag => tag.name) : [];
  
  // Generate frontmatter
  let frontmatter = `---
title: "${title}"
date: ${date}
draft: false
slug: "${slug}"
`;

  if (categories.length > 0) {
    frontmatter += `categories:
${categories.map(cat => `  - "${cat}"`).join('\n')}
`;
  }

  if (tags.length > 0) {
    frontmatter += `tags:
${tags.map(tag => `  - "${tag}"`).join('\n')}
`;
  }

  frontmatter += `---\n\n`;

  // Clean HTML content (simplified approach)
  // For a real-world version, you'd want to use a more sophisticated HTML-to-markdown converter
  const cleanedContent = content
    .replace(/<\/?h1[^>]*>/g, '# ')
    .replace(/<\/?h2[^>]*>/g, '## ')
    .replace(/<\/?h3[^>]*>/g, '### ')
    .replace(/<\/?h4[^>]*>/g, '#### ')
    .replace(/<\/?h5[^>]*>/g, '##### ')
    .replace(/<\/?h6[^>]*>/g, '###### ')
    .replace(/<\/?p[^>]*>/g, '\n\n')
    .replace(/<\/?br[^>]*>/g, '\n')
    .replace(/<\/?strong[^>]*>/g, '**')
    .replace(/<\/?em[^>]*>/g, '*')
    .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)')
    .replace(/<\/?ul[^>]*>/g, '\n')
    .replace(/<li[^>]*>/g, '- ')
    .replace(/<\/li>/g, '')
    .replace(/<[^>]+>/g, '') // Remove any other HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  return {
    slug,
    content: frontmatter + cleanedContent,
    lang: 'en', // Default to English, can be parameterized
  };
}

/**
 * Save transformed content to Hugo content directory
 */
async function saveToHugoContent(transformedContent) {
  const { slug, content, lang } = transformedContent;
  const contentPath = path.join(CONTENT_DIR, lang, 'posts', `${slug}.md`);
  
  // Create directory if it doesn't exist
  await fs.mkdir(path.dirname(contentPath), { recursive: true });
  
  // Write the file
  await fs.writeFile(contentPath, content, 'utf8');
  
  console.log(`Saved ${contentPath}`);
}

/**
 * Main function
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Please provide the path to WordPress content JSON file');
    process.exit(1);
  }

  const contentFilePath = process.argv[2];
  
  try {
    const data = await fs.readFile(contentFilePath, 'utf8');
    const posts = JSON.parse(data);
    
    if (!Array.isArray(posts)) {
      console.error('Expected an array of posts');
      process.exit(1);
    }
    
    console.log(`Found ${posts.length} posts to transform`);
    
    for (const post of posts) {
      const transformedContent = transformToHugoContent(post);
      await saveToHugoContent(transformedContent);
    }
    
    console.log('Transformation complete!');
  } catch (error) {
    console.error('Error processing content:', error);
    process.exit(1);
  }
}

main();
