const YAML = require('yaml');
const logger = require('./logger');

class ContentValidator {
  constructor() {
    this.errors = [];
  }

  /**
   * Validate a transformed Hugo content file
   */
  validateContent(content, filePath) {
    this.errors = [];
    const { frontMatter, body } = this.separateFrontMatterAndBody(content);
    
    return (
      this.validateFrontMatter(frontMatter, filePath) &&
      this.validateBody(body, filePath)
    );
  }

  /**
   * Separate front matter from body content
   */
  separateFrontMatterAndBody(content) {
    const match = content.match(/^---([\s\S]*?)\n---([\s\S]*)$/);
    if (!match) {
      this.errors.push('Invalid document structure: missing front matter delimiters');
      return { frontMatter: '', body: content };
    }
    return {
      frontMatter: match[1].trim(),
      body: match[2].trim()
    };
  }

  /**
   * Validate the front matter
   */
  validateFrontMatter(frontMatter, filePath) {
    try {
      const parsed = YAML.parse(frontMatter);
      
      // Required fields
      const requiredFields = ['title', 'date', 'lang', 'translationKey'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        this.errors.push(`Missing required fields in ${filePath}: ${missingFields.join(', ')}`);
        return false;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(parsed.date)) {
        this.errors.push(`Invalid date format in ${filePath}: ${parsed.date}`);
        return false;
      }

      // Validate language
      if (!['en', 'fr'].includes(parsed.lang)) {
        this.errors.push(`Invalid language in ${filePath}: ${parsed.lang}`);
        return false;
      }

      // Validate title length
      if (parsed.title.length < 3) {
        this.errors.push(`Title too short in ${filePath}`);
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`Invalid YAML in front matter of ${filePath}: ${error.message}`);
      logger.error('Front matter validation failed', error, {
        filePath,
        frontMatter
      });
      return false;
    }
  }

  /**
   * Validate the markdown body
   */
  validateBody(body, filePath) {
    if (!body.trim()) {
      this.errors.push(`Empty content body in ${filePath}`);
      return false;
    }

    // Validate GCDS shortcodes
    const shortcodeMatches = {
      buttons: (body.match(/{{< gcds-button[\s\S]*?>}}[\s\S]*?{{< \/gcds-button >}}/g) || []),
      alerts: (body.match(/{{< gcds-alert[\s\S]*?>}}[\s\S]*?{{< \/gcds-alert >}}/g) || [])
    };

    // Check for unclosed shortcodes
    if (body.includes('{{<') && !body.includes('>}}')) {
      this.errors.push(`Unclosed shortcode found in ${filePath}`);
      return false;
    }

    // Validate button shortcodes
    for (const button of shortcodeMatches.buttons) {
      if (!button.includes('href=')) {
        this.errors.push(`Button missing href attribute in ${filePath}`);
        return false;
      }
    }

    // Validate alert shortcodes
    for (const alert of shortcodeMatches.alerts) {
      if (!alert.includes('type=')) {
        this.errors.push(`Alert missing type attribute in ${filePath}`);
        return false;
      }
    }

    // Check for common markdown syntax errors
    const syntaxChecks = [
      { pattern: /\[([^\]]*?)\]\(([^\)]*?)\)/, message: 'Invalid link syntax' },
      { pattern: /!\[([^\]]*?)\]\(([^\)]*?)\)/, message: 'Invalid image syntax' },
      { pattern: /#{1,6} /, message: 'Invalid heading syntax' }
    ];

    for (const check of syntaxChecks) {
      if (body.includes(check.pattern) && !check.pattern.test(body)) {
        this.errors.push(`${check.message} in ${filePath}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all validation errors
   */
  getErrors() {
    return this.errors;
  }
}

module.exports = ContentValidator;
