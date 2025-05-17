const cheerio = require('cheerio');
const path = require('path');
const titleToFilename = require('./utils/titleToFilename');
const logger = require('./utils/logger');

/**
 * Transform GC-Articles content into Hugo Markdown format
 */
function transformArticleToHugo(article, lang, translationKey) {
  try {
    // Extract article metadata
    const { 
      title, 
      publishDate, 
      content,
      author,
      slug,
      excerpt
    } = article;

    // Extract featured image metadata if available
    let imageMetadata = {};
    if (article._embedded?.['wp:featuredmedia']?.[0]) {
      const media = article._embedded['wp:featuredmedia'][0];
      imageMetadata = {
        image: media.source_url,
        imageAlt: media.alt_text || title,
        thumb: media.media_details?.sizes?.thumbnail?.source_url || media.source_url
      };
    }

    // Generate Hugo front matter
    const frontMatter = generateFrontMatter({
      title: escapeYaml(title),
      date: new Date(publishDate).toISOString(),
      author: author ? escapeYaml(author.name) : '',
      lang,
      translationKey,
      slug: escapeYaml(slug),
      description: excerpt ? escapeYaml(excerpt) : '',
      draft: false,
      ...imageMetadata
    });

    // Transform content to Markdown
    const markdownBody = transformContentToMarkdown(content);

    // Generate file path
    const filename = `${titleToFilename(title)}.md`;
    const filePath = path.join('content', lang, filename);

    logger.info('Transformed article content', {
      title,
      lang,
      filePath
    });

    return {
      content: `${frontMatter}\n\n${markdownBody}`,
      filePath
    };

  } catch (error) {
    logger.error('Content transformation failed', error, {
      articleId: article.id,
      title: article.title,
      lang
    });
    throw error;
  }
}

/**
 * Generate Hugo front matter in YAML format
 */
function generateFrontMatter(metadata) {
  let output = '---\n';
  
  // Sort keys alphabetically and build front matter
  Object.keys(metadata)
    .sort()
    .forEach(key => {
      const value = metadata[key];
      
      // Only include properties that have values
      if (value !== undefined && value !== '') {
        if (typeof value === 'string' && value.includes('\n')) {
          // Multi-line string
          output += `${key}: |-\n  ${value.replace(/\n/g, '\n  ')}\n`;
        } else {
          // Regular value (string, boolean, etc)
          output += `${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
        }
      }
    });
  
  output += '---';
  return output;
}

/**
 * Transform HTML content to Markdown with GCDS components
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
 * Transform HTML content to Markdown
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
      case 'h4':
        markdown += `#### ${$el.text()}\n\n`;
        break;
      case 'p':
        markdown += `${$el.text()}\n\n`;
        break;
      case 'a':
        const href = $el.attr('href');
        markdown += `[${$el.text()}](${href})\n\n`;
        break;
      case 'ul':
        $el.find('li').each((_, li) => {
          markdown += `- ${$(li).text()}\n`;
        });
        markdown += '\n';
        break;
      case 'ol':
        $el.find('li').each((i, li) => {
          markdown += `${i + 1}. ${$(li).text()}\n`;
        });
        markdown += '\n';
        break;
      case 'img':
        const src = $el.attr('src');
        const alt = $el.attr('alt') || '';
        markdown += `![${alt}](${src})\n\n`;
        break;
      case 'gcds-button':
        const buttonHref = $el.attr('href') || '';
        const buttonText = $el.text();
        markdown += `{{< gcds-button href="${buttonHref}" >}}${buttonText}{{< /gcds-button >}}\n\n`;
        break;
      case 'gcds-alert':
        const alertType = $el.attr('type') || 'info';
        const alertContent = $el.html();
        markdown += `{{< gcds-alert type="${alertType}" >}}${alertContent}{{< /gcds-alert >}}\n\n`;
        break;
      case 'blockquote':
        markdown += `> ${$el.text()}\n\n`;
        break;
      case 'code':
        markdown += `\`${$el.text()}\`\n\n`;
        break;
      case 'pre':
        markdown += `\`\`\`\n${$el.text()}\n\`\`\`\n\n`;
        break;
    }
  });

  return markdown.trim();
}

/**
 * Transform block-based content to Markdown
 */
function transformBlocksToMarkdown(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        const level = '#'.repeat(block.level || 1);
        return `${level} ${block.content}\n\n`;
      
      case 'paragraph':
        return `${block.content}\n\n`;
      
      case 'list':
        return block.items.map(item => `${block.ordered ? '1.' : '-'} ${item}\n`).join('') + '\n';
      
      case 'image':
        return `![${block.alt || ''}](${block.url})\n\n`;
      
      case 'gcds-button':
        return `{{< gcds-button href="${block.href}" >}}${block.text}{{< /gcds-button >}}\n\n`;
      
      case 'gcds-alert':
        return `{{< gcds-alert type="${block.alertType}" >}}${block.content}{{< /gcds-alert >}}\n\n`;
      
      default:
        return '';
    }
  }).join('');
}

/**
 * Escape special characters in YAML values
 */
function escapeYaml(text) {
  if (!text) return '';
  return text
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .trim();
}

module.exports = {
  transformArticleToHugo
};
