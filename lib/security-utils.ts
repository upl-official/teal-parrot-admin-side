/**
 * Security utility functions for the admin panel
 */

/**
 * Sets security-related meta tags to prevent indexing
 * Use this component in all admin layout files
 */
export function NoIndexMetaTags() {
  return (
    <>
      <meta name="robots" content="noindex, nofollow, noarchive" />
      <meta name="googlebot" content="noindex, nofollow, noarchive" />
      <meta name="bingbot" content="noindex, nofollow, noarchive" />
    </>
  )
}

/**
 * Generates Content Security Policy headers
 * @returns CSP header string
 */
export function generateCSP() {
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
