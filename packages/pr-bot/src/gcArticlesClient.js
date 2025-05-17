const axios = require('axios');

class GCArticlesClient {
  constructor() {
    this.baseURL = process.env.GC_ARTICLES_API_URL;
    this.auth = {
      username: process.env.GC_ARTICLES_API_USERNAME,
      password: process.env.GC_ARTICLES_API_PASSWORD,
    };
  }

  async getPosts(lang = 'en') {
    try {
      const response = await axios.get(`${this.baseURL}/posts`, {
        params: {
          lang: lang,
          _embed: 'wp:featuredmedia'
        },
        auth: this.auth,
      });
      return response.data;
    } catch (error) {
      this.handleError(`Failed to fetch ${lang} posts`, error);
      throw error;
    }
  }

  /**
   * Fetches both English and French versions of posts
   * @returns {Promise<{en: Array, fr: Array}>} Object containing posts in both languages
   */
  async getBilingualPosts() {
    try {
      const [enPosts, frPosts] = await Promise.all([
        this.getPosts('en'),
        this.getPosts('fr')
      ]);
      
      return {
        en: enPosts,
        fr: frPosts
      };
    } catch (error) {
      this.handleError('Failed to fetch bilingual posts', error);
      throw error;
    }
  }

  handleError(message, error) {
    console.error(`${message}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
    });
  }
}

module.exports = GCArticlesClient;
