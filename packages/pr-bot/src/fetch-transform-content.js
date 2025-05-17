const cheerio = require('cheerio');
const titleToFilename = require('./utils/titleToFilename');
const path = require('path');
const fs = require('fs').promises;

/**
 * Transforms GC-Articles content into Hugo Markdown format
 * @param {Object} article - Article object from GC-Articles
 * @param {string} lang - Language code (en/fr)
 * @param {string} translationKey - Unique key to link translations
 * @returns {Object} Hugo-compatible Markdown content with front matter and file path
 */
function transformArticleToHugo(article, lang, translationKey) {
  // Extract basic article metadata
  const { title, publishDate, content } = article;
  
  // Extract image metadata if available
  let imageMetadata = {};
  if (article._embedded?.['wp:featuredmedia']?.[0]) {
    const media = article._embedded['wp:featuredmedia'][0];
    imageMetadata = {
      image: media.media_details.sizes.full.source_url,
      imageAlt: media.alt_text,
      thumb: media.media_details.sizes.full.source_url
    };
  }

  // Generate Hugo front matter
  const frontMatter = generateFrontMatter({
    title,
    date: publishDate,
    lang,
    translationKey,
    ...imageMetadata
  });

  // Transform content to Markdown
  const markdownBody = transformContentToMarkdown(content);

  // Generate file path
  const filename = `${titleToFilename(title)}.md`;
  const filePath = path.join('content', lang, filename);

  // Return both the content and the file path
  return {
    content: `${frontMatter}\n${markdownBody}`,
    filePath
  };
}

/**
 * Generates Hugo front matter in YAML format
 * @param {Object} metadata - Article metadata
 * @returns {string} YAML front matter block
 */
function generateFrontMatter(metadata) {
  // Create a normalized front matter object with all potential properties
  const frontMatter = {
    author: metadata.author || '',
    date: metadata.date ? new Date(metadata.date).toISOString() : '',
    draft: false,
    image: metadata.image ? escapeYaml(metadata.image) : '',
    imageAlt: metadata.imageAlt ? escapeYaml(metadata.imageAlt) : '',
    lang: metadata.lang || 'en',
    thumb: metadata.thumb ? escapeYaml(metadata.thumb) : '',
    title: metadata.title ? escapeYaml(metadata.title) : '',
    translationKey: metadata.translationKey || ''
  };

  // Create markdown with alphabetized front matter
  let output = '---\n';
  
  // Sort keys alphabetically and build front matter
  Object.keys(frontMatter)
    .sort()
    .forEach(key => {
      const value = frontMatter[key];
      // Only include properties that have values
      if (value !== undefined && value !== '') {
        if (typeof value === 'string' && value.includes('\n')) {
          // Multi-line string
          output += `${key}: >-\n  '${value}'\n`;
        } else {
          // Regular value (string, boolean, etc)
          output += `${key}: ${typeof value === 'string' ? `'${value}'` : value}\n`;
        }
      }
    });
  
  output += '---';
  return output;
}

/**
 * Escapes special characters in YAML values
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeYaml(text) {
  return text.replace(/"/g, '\\"');
}

/**
 * Transforms HTML content to Markdown with GCDS components
 * @param {string} content - HTML or block-based content
 * @returns {string} Markdown content
 */
function transformContentToMarkdown(content) {
  // For HTML content
  if (typeof content === 'string') {
    return transformHtmlToMarkdown(content);
  }
  
  // For block-based content
  return transformBlocksToMarkdown(content);
}

/**
 * Transforms HTML content to Markdown
 * @param {string} html - HTML content
 * @returns {string} Markdown content
 */
function transformHtmlToMarkdown(html) {
  const $ = cheerio.load(html);
  let markdown = '';

  $('*').each((_, element) => {
    const $el = $(element);
    
    switch (element.tagName) {
      case 'h1':
        markdown += `# ${$el.text()}\n\n`;
        break;
      case 'h2':
        markdown += `## ${$el.text()}\n\n`;
        break;
      case 'h3':
        markdown += `### ${$el.text()}\n\n`;
        break;
      case 'p':
        markdown += `${$el.text()}\n\n`;
        break;
      case 'gcds-button':
        // Transform GCDS button to Hugo shortcode
        const buttonText = $el.text();
        const href = $el.attr('href') || '';
        markdown += `{{< gcds-button href="${href}" >}}${buttonText}{{< /gcds-button >}}\n\n`;
        break;
      case 'gcds-alert':
        // Transform GCDS alert to Hugo shortcode
        const alertType = $el.attr('type') || 'info';
        const alertContent = $el.html();
        markdown += `{{< gcds-alert type="${alertType}" >}}${alertContent}{{< /gcds-alert >}}\n\n`;
        break;
    }
  });

  return markdown.trim();
}

/**
 * Transforms block-based content to Markdown
 * @param {Array} blocks - Array of content blocks
 * @returns {string} Markdown content
 */
function transformBlocksToMarkdown(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        const level = '#'.repeat(block.level || 1);
        return `${level} ${block.content}\n\n`;
      
      case 'paragraph':
        return `${block.content}\n\n`;
      
      case 'gcds-button':
        return `{{< gcds-button href="${block.href}" >}}${block.text}{{< /gcds-button >}}\n\n`;
      
      case 'gcds-alert':
        return `{{< gcds-alert type="${block.alertType}" >}}${block.content}{{< /gcds-alert >}}\n\n`;
      
      default:
        return '';
    }
  }).join('');
}

module.exports = {
  transformArticleToHugo
};
