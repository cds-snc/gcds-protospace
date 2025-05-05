#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const processBilingualContent = require('./fetch-transform-content');

// Set output directory - modify as needed
const OUTPUT_DIR = path.join(__dirname, '../packages/website/content');

/**
 * Writes article content to files in the appropriate directories
 */
async function writeArticlesToFiles() {
  try {
    console.log('Processing bilingual content from GC-Articles...');
    
    // Get processed bilingual content
    const articles = await processBilingualContent();
    console.log(`Found ${articles.length} articles to process`);
    
    // Process each article
    for (const article of articles) {
      const { fileName, body } = article;
      const filePath = path.join(OUTPUT_DIR, fileName);
      const fileDir = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(fileDir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, body);
      console.log(`Created ${fileName}`);
    }
    
    console.log('Successfully processed all articles!');
  } catch (error) {
    console.error('Error processing articles:', error);
    process.exit(1);
  }
}

// Run the script
writeArticlesToFiles();
