const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class ContentHashStore {
  constructor(storePath) {
    this.storePath = storePath || path.join(__dirname, '../../.content-hashes.json');
    this.hashes = {};
  }

  /**
   * Loads the hash store from disk
   */
  async load() {
    try {
      const data = await fs.readFile(this.storePath, 'utf8');
      this.hashes = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist yet, start with empty store
      this.hashes = {};
    }
  }

  /**
   * Saves the hash store to disk
   */
  async save() {
    await fs.writeFile(this.storePath, JSON.stringify(this.hashes, null, 2));
  }

  /**
   * Computes a hash for a content item
   * @param {Object} content - The content object to hash
   * @returns {string} Content hash
   */
  computeHash(content) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex');
  }

  /**
   * Checks if content has changed by comparing hashes
   * @param {string} id - Content identifier (e.g., post ID or URL)
   * @param {Object} content - The content to check
   * @returns {boolean} Whether the content has changed
   */
  hasChanged(id, content) {
    const newHash = this.computeHash(content);
    return this.hashes[id] !== newHash;
  }

  /**
   * Updates the stored hash for a content item
   * @param {string} id - Content identifier
   * @param {Object} content - The content whose hash to store
   */
  updateHash(id, content) {
    this.hashes[id] = this.computeHash(content);
  }

  /**
   * Removes old hashes that are no longer needed
   * @param {Array<string>} activeIds - Array of content IDs that are still active
   */
  cleanup(activeIds) {
    const idsSet = new Set(activeIds);
    Object.keys(this.hashes).forEach(id => {
      if (!idsSet.has(id)) {
        delete this.hashes[id];
      }
    });
  }
}

module.exports = ContentHashStore;
