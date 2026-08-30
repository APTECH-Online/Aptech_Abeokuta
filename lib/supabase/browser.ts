'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in Client Components.
 * Uses only the public Supabase URL and anon/publishable key.
 * NEVER put the service-role key in this file.
 */
export function createClient() {
  return createBrowserClient(
    'https://vmqotbbwmcarpzdgaxwu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcW90YmJ3bWNhcnB6ZGdheHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwODg1ODAsImV4cCI6MjEwMzY2NDU4MH0.4QQ3EnRo8jL2cmMkQMPrZedkOLmLwoAtOV1MceD86pU'
  )
}