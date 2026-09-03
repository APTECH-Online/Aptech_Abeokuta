'use server'

import { createClient } from '../../../lib/supabase/server'

export async function signInStaff(email: string, password: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: 'Incorrect email or password.' }
    }

    return { error: null }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
