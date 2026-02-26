// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Замените на ваши данные из Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Инициализация клиента
const supabase = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabase) {
    console.error('Supabase JS не загружен. Проверьте CDN скрипт.');
}
