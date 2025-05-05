/**
 * Script to fetch and transform bilingual content from GC-Articles endpoints
 * Uses native fetch API available in Node.js 18+
 * Converts API content to markdown files with alphabetized front matter
 */
const titleToFilename = require('./utils/titleToFilename');

/**
 * Generates markdown content with alphabetized front matter from GC-Article data
 * @param {Object} post - Post data from GC-Article endpoint
 * @param {string} lang - Language code ('en' or 'fr')
 * @returns {string} - Markdown content with front matter
 */
const generateMarkdownContent = async (post, lang) => {
  // Replace HTML entities in title
  const cleanTitle = post.title.rendered.replace(/&#8217;/g, "'").replace(/&amp;/g, "&");
  
  // Create frontmatter object with all properties
  const frontMatter = {
    author: post.meta?.gc_author_name || '',
    date: post.date,
    description: post.markdown?.excerpt?.rendered || '',
    lang: lang,
    title: cleanTitle,
    // Use post.translationKey if available, otherwise fall back to slug
    translationKey: post.translationKey || post.slug
  };

  // Add image properties if available
  if (post._embedded?.['wp:featuredmedia']) {
    const media = post._embedded['wp:featuredmedia'][0];
    frontMatter.image = media.media_details.sizes.full.source_url;
    frontMatter.imageAlt = media.alt_text;
    frontMatter.thumb = media.media_details.sizes.full.source_url;
  }

  // Create markdown with alphabetized front matter
  let output = '---\n';
  
  // Sort keys alphabetically and build front matter
  Object.keys(frontMatter)
    .sort()
    .forEach(key => {
      const value = frontMatter[key];
      if (value) {
        if (key === 'description') {
          // Multi-line description
          output += `${key}: >-\n  '${value}'\n`;
        } else {
          // Regular string value
          output += `${key}: '${value}'\n`;
        }
      }
    });
  
  output += '---\n';
  output += `${post.content.rendered}\n`;

  return output;
};

/**
 * Fetches and processes bilingual content from GC-Article endpoints
 * @returns {Promise<Object>} - Object containing English and French content
 */
const fetchBilingualContent = async () => {
  try {
    // Get endpoint URLs from environment variables
    const enEndpoint = process.env.GC_ARTICLES_ENDPOINT_EN;
    const frEndpoint = process.env.GC_ARTICLES_ENDPOINT_FR;

    if (!enEndpoint || !frEndpoint) {
      throw new Error('Missing endpoint configuration for one or both languages');
    }

    // Fetch content from both endpoints
    const [enResponse, frResponse] = await Promise.all([
      fetch(`${enEndpoint}posts?markdown=true&_embed`),
      fetch(`${frEndpoint}posts?markdown=true&_embed`)
    ]);

    if (!enResponse.ok || !frResponse.ok) {
      throw new Error(`HTTP error! EN status: ${enResponse.status}, FR status: ${frResponse.status}`);
    }

    const enData = await enResponse.json();
    const frData = await frResponse.json();

    if (!Array.isArray(enData) || !Array.isArray(frData)) {
      throw new Error('Expected array of posts from API');
    }

    // Process English content
    const enContent = await Promise.all(enData.map(async post => {
      const content = await generateMarkdownContent(post, 'en');
      const fileName = titleToFilename(post.title.rendered);
      return { 
        body: content, 
        fileName: `en/${fileName}.md`,
        slug: post.slug
      };
    }));

    // Process French content
    const frContent = await Promise.all(frData.map(async post => {
      const content = await generateMarkdownContent(post, 'fr');
      const fileName = titleToFilename(post.title.rendered);
      return { 
        body: content, 
        fileName: `fr/${fileName}.md`,
        slug: post.slug
      };
    }));

    return {
      en: enContent,
      fr: frContent
    };
  } catch (error) {
    console.error('Failed to fetch bilingual content:', error);
    throw error;
  }
};

/**
 * Main function to fetch, process and prepare bilingual content from GC-Articles
 * @returns {Promise<Array>} - Array of objects containing file content and fileName
 */
const processBilingualContent = async () => {
  try {
    // Fetch content from endpoints
    const content = await fetchBilingualContent();

    // Combine all content files into a single array
    return [
      ...content.en,
      ...content.fr
    ];
  } catch (error) {
    console.error('Failed to process bilingual content:', error);
    throw error;
  }
};

module.exports = processBilingualContent;
