/**
 * Converts a title to a URL-friendly filename (slug).
 * Supports English and French (accent normalization).
 * @param { string } title - Title to convert to filename
 * @return { string } URL-friendly filename
 */
function titleToFilename( title ) {
  return title
    .normalize( 'NFD' ) // Decompose accented characters
    .replace( /[\u0300-\u036f]/g, '' ) // Remove accents
    .toLowerCase()
    .replace( /[^a-z0-9\s-]/g, '' ) // Remove invalid chars
    .trim()
    .replace( /[\s_-]+/g, '-' ) // Collapse whitespace and underscores to hyphen
    .replace( /^-+|-+$/g, '' ); // Trim leading/trailing hyphens
}
module.exports = titleToFilename;