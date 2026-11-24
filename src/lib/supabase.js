import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// No credentials means explicit, clearly labelled demo mode.
export const demoMode = !(url && key)
export const supabase = demoMode ? null : createClient(url, key)
