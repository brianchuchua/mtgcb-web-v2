/**
 * Route detection utilities for identifying page types
 * Used to determine how browse state should behave on different pages
 */

/**
 * Check if the current path is a set-specific page (browse or collection)
 * Examples:
 * - /browse/sets/foundational → true
 * - /collections/123/foundational → true
 * - /browse → false
 * - /collections/123 → false
 */
export function isSetSpecificPage(pathname: string): boolean {
  return isCollectionSetPage(pathname) || isBrowseSetPage(pathname);
}

/**
 * Check if the current path is a collection page
 * Examples:
 * - /collections/123 → true
 * - /collections/123/foundational → true
 * - /browse → false
 */
export function isCollectionPage(pathname: string): boolean {
  return /^\/collections\/\d+/.test(pathname);
}

/**
 * Check if the current path is a collection set page (shows cards for a specific set)
 * Examples:
 * - /collections/123/foundational → true
 * - /collections/123 → false
 */
export function isCollectionSetPage(pathname: string): boolean {
  return /^\/collections\/\d+\/[^\/]+$/.test(pathname);
}

/**
 * Check if the current path is a browse page
 * Examples:
 * - /browse → true
 * - /browse/sets/foundational → true
 * - /collections/123 → false
 */
export function isBrowsePage(pathname: string): boolean {
  return pathname.startsWith('/browse');
}

/**
 * Check if the current path is a browse set page (shows cards for a specific set)
 * Examples:
 * - /browse/sets/foundational → true
 * - /browse → false
 */
export function isBrowseSetPage(pathname: string): boolean {
  return /^\/browse\/sets\/[^\/]+$/.test(pathname);
}
