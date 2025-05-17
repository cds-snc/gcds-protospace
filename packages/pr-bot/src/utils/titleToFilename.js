/**
 * Converts a title to a Hugo-friendly filename
 * @param {string} title - The title to convert
 * @returns {string} The converted filename (without extension)
 */
function titleToFilename(title) {
  return title
    .toLowerCase() // Convert to lowercase
    .normalize('NFD') // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

module.exports = titleToFilename;
