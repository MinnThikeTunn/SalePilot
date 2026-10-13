/**
 * URL-safe unique shop identifier for public links
 */
export function generateShopId(): string {
  // Use crypto.getRandomValues for browser environment
  const array = new Uint8Array(12);
  window.crypto.getRandomValues(array);
  
  // Convert to base64url format
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds the public URL for a shop
 */
export function buildShopPublicUrl(shopId: string): string {
  const base = window.location.origin;
  return `${base}/shop/${shopId}`;
}
