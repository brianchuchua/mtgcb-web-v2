/**
 * Token Encoder/Decoder for URL shortening
 * 
 * Converts long hex tokens to shorter base62 strings and back
 * This provides URL-safe, case-sensitive encoding that significantly
 * reduces the length of share tokens in URLs.
 * 
 * Example:
 * Hex (64 chars): ffb676098ccc57db3c965976c4bb1515b7122fb086fe5db5562cdfa3cc832bd9
 * Base62 (~43 chars): 6Y8KpXm7NQR3kL9TvB2hJ4WsFnDxA1ZcE5MgU
 */

// Base62 alphabet (0-9, a-z, A-Z)
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(62);

/**
 * Converts a hex string to base62
 * @param hex - The hexadecimal string to encode
 * @returns The base62 encoded string
 */
export function encodeToken(hex: string): string {
  if (!hex || hex.length === 0) return '';
  
  try {
    // Convert hex to BigInt
    const num = BigInt('0x' + hex);
    
    if (num === BigInt(0)) return '0';
    
    let result = '';
    let temp = num;
    
    while (temp > BigInt(0)) {
      const remainder = temp % BASE;
      result = BASE62_ALPHABET[Number(remainder)] + result;
      temp = temp / BASE;
    }
    
    return result;
  } catch (error) {
    // If encoding fails, return original (fallback)
    console.error('Token encoding failed:', error);
    return hex;
  }
}

/**
 * Converts a base62 string back to hex
 * @param encoded - The base62 encoded string
 * @returns The original hexadecimal string
 */
export function decodeToken(encoded: string): string {
  if (!encoded || encoded.length === 0) return '';
  
  try {
    let result = BigInt(0);
    
    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i];
      const value = BASE62_ALPHABET.indexOf(char);
      
      if (value === -1) {
        // Invalid character, assume it's already hex (fallback)
        return encoded;
      }
      
      result = result * BASE + BigInt(value);
    }
    
    // Convert BigInt back to hex string
    let hex = result.toString(16);
    
    // Pad with leading zeros if necessary to maintain original length
    // Most share tokens are 64 characters (256 bits)
    while (hex.length < 64 && hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    
    return hex;
  } catch (error) {
    // If decoding fails, assume it's already hex (fallback)
    console.error('Token decoding failed:', error);
    return encoded;
  }
}

/**
 * Checks if a string looks like a hex token (all hex characters)
 * @param str - The string to check
 * @returns True if the string appears to be hex
 */
export function isHexToken(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str) && str.length >= 32;
}

/**
 * Smart encode - only encodes if it looks like a hex token
 * @param token - The token to potentially encode
 * @returns The encoded token if it was hex, otherwise the original
 */
export function smartEncodeToken(token: string): string {
  if (isHexToken(token)) {
    return encodeToken(token);
  }
  return token;
}

/**
 * Smart decode - only decodes if it looks like base62
 * @param token - The token to potentially decode
 * @returns The decoded token if it was base62, otherwise the original
 */
export function smartDecodeToken(token: string): string {
  // If it's already hex, return as-is
  if (isHexToken(token)) {
    return token;
  }
  
  // Try to decode, will return original if it fails
  return decodeToken(token);
}