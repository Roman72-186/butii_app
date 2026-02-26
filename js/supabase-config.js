// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Замените на ваши данные из Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://dbcbhdlwxhayqoyddiou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY2JoZGx3eGhheXFveWRkaW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY4NjAsImV4cCI6MjA4NzY0Mjg2MH0.GfUfg_8cdA7QNj5LLF0zQZKok7SJ1ubp-y0rFoZyU4Q';

// Инициализация клиента
const supabase = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabase) {
    console.error('Supabase JS не загружен. Проверьте CDN скрипт.');
}
