const axios = require('axios');
const logger = require('./utils/logger');

class GCArticlesClient {
  constructor() {
    const {
      GC_ARTICLES_API_URL: baseURL,
      GC_ARTICLES_API_USERNAME: username,
      GC_ARTICLES_API_PASSWORD: password
    } = process.env;

    if (!baseURL || !username || !password) {
      throw new Error('Missing required GC Articles API configuration');
    }

    this.baseURL = baseURL;
    this.auth = { username, password };
    this.client = axios.create({
      baseURL,
      auth: this.auth,
      timeout: 10000
    });
  }

  /**
   * Fetch posts for a specific language
   */
  async getPosts(lang = 'en') {
    try {
      const response = await this.client.get('/posts', {
        params: {
          lang,
          _embed: 'wp:featuredmedia',
          per_page: 100, // Adjust based on needs
          status: 'publish'
        }
      });

      logger.info('Retrieved posts from GC-Articles', {
        lang,
        count: response.data.length
      });

      return response.data;
    } catch (error) {
      this.handleError(`Failed to fetch ${lang} posts`, error);
      throw error;
    }
  }

  /**
   * Fetch both English and French posts
   */
  async getBilingualPosts() {
    try {
      logger.info('Fetching bilingual posts from GC-Articles');

      const [enPosts, frPosts] = await Promise.all([
        this.getPosts('en'),
        this.getPosts('fr')
      ]);

      return { en: enPosts, fr: frPosts };
    } catch (error) {
      this.handleError('Failed to fetch bilingual posts', error);
      throw error;
    }
  }

  /**
   * Handle API errors with proper logging
   */
  handleError(message, error) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const url = error.config?.url;

    logger.error(message, error, {
      status,
      statusText,
      url
    });

    // Enhance error message with API details
    const enhancedMessage = `${message}: ${status} ${statusText}`;
    const enhancedError = new Error(enhancedMessage);
    enhancedError.originalError = error;
    enhancedError.status = status;
    
    throw enhancedError;
  }
}

module.exports = GCArticlesClient;
