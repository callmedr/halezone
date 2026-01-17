
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byiaqutzcfwgxiwvmqlx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aWFxdXR6Y2Z3Z3hpd3ZtcWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTYzODgsImV4cCI6MjA4MjQ5MjM4OH0.GwqyxLR-V-KWSSJqmpFJ7sO1Ni2IEXHUIkNkKrYDivU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = 'board';
export const ADMIN_EMAIL = 'callmedoctor@nate.com';
