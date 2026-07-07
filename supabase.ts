import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export const connectSupabase = async () => {
  try {
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao conectar Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Supabase conectado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão Supabase:', error);
    return false;
  }
};
