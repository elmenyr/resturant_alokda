// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bcihwbulbwajxoxmgqmy.supabase.co'
const supabaseAnonKey = 'sb_publishable_8zNevEieJYIy1-SBlR28Og_Z0yhvg-4'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names
export const MENU_BUCKET = 'menu-pdf'
export const OFFERS_IMAGES_BUCKET = 'offers-images'

