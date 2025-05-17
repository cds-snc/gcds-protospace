const axios = require('axios');

class GCArticlesClient {
  constructor() {
    this.baseURL = process.env.GC_ARTICLES_API_URL;
    this.auth = {
      username: process.env.GC_ARTICLES_API_USERNAME,
      password: process.env.GC_ARTICLES_API_PASSWORD,
    };
  }

  async getPosts() {
    try {
      const response = await axios.get(`${this.baseURL}/posts`, {
        auth: this.auth,
      });
      return response.data;
    } catch (error) {
      this.handleError('Failed to fetch posts', error);
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
