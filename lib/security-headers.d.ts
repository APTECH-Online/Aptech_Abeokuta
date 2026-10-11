export interface SecurityHeaderOptions {
  supabaseUrl?: string
  isDev?: boolean
  reportOnly?: boolean
}
export function buildCsp(options?: Pick<SecurityHeaderOptions, 'supabaseUrl' | 'isDev'>): string
export function buildSecurityHeaders(options?: SecurityHeaderOptions): { key: string; value: string }[]
