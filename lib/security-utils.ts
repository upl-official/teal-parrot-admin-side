/**
 * Security utility functions for the admin panel
 */

/**
 * Checks if the current request is from a known crawler
 * @param userAgent User agent string
 * @returns Boolean indicating if it's a crawler
 */
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false

  const crawlerPatterns = [
    /bot/i,
    /spider/i,
    /crawl/i,
    /slurp/i,
    /scrape/i,
    /fetch/i,
    /lighthouse/i,
    /headless/i,
    /chrome-lighthouse/i,
    /pingdom/i,
    /pagespeed/i,
  ]

  return crawlerPatterns.some((pattern) => pattern.test(userAgent))
}

/**
 * Generates Content Security Policy headers
 * @returns CSP header string
 */
export function generateCSP(): string {
  const csp = [
    // Default policies
    "default-src 'self'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ")

  return csp
}
