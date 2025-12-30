import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(https://qmjgzxizjbmqwsltxrmx.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamd6eGl6amJtcXdzbHR4cm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTcyNDAsImV4cCI6MjA4MjY5MzI0MH0.jSk-WMBvcTslYWVCK9fdLO5BALkOYXNgehgIvxji-zs)
