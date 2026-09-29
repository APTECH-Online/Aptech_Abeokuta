/**
 * Legacy URL migration map.
 *
 * These are the legacy routes actually evidenced by the previous APTECH
 * Abeokuta site: the old HTML navigation linked to index.html, about.html,
 * courses.html, gallery.html and contact.html. Keep this list explicit so a
 * typo or unrelated .html URL cannot be redirected to an invented page.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/index.html': '/',
  '/about.html': '/about',
  '/courses.html': '/courses',
  '/gallery.html': '/gallery',
  '/contact.html': '/contact',
  '/sitemap': '/sitemap.xml'
}

export const LEGACY_REDIRECT_PATHS = Object.keys(LEGACY_REDIRECTS)
