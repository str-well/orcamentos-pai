// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

console.log("Update Budget Status Function Started!")

// Configuração dos cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrair o ID do orçamento da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const budgetId = pathParts[pathParts.length - 1];

    if (!budgetId) {
      return new Response(
        JSON.stringify({ error: 'ID do orçamento não fornecido' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Extrair o token de autenticação
    const token = authHeader.replace('Bearer ', '');

    // Obter o novo status do corpo da requisição
    const { status } = await req.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Status inválido' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://dbxabmijgyxuazvdelpx.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieGFibWlqZ3l4dWF6dmRlbHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5ODI0NzcsImV4cCI6MjAyNDU1ODQ3N30.Wy-QQlgTMgumGJ9GZLz-XrGkZ9IgKBIJRbLIi2_zcLs';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Atualizar o status do orçamento
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        status: status,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId);

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status do orçamento' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        message: `Status do orçamento ${budgetId} atualizado para ${status}`,
        budgetId: budgetId,
        status: status,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar status do orçamento' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

/* Para invocar localmente:

  1. Execute `supabase start` (veja: https://supabase.com/docs/reference/cli/supabase-start)
  2. Faça uma requisição HTTP:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-budget-status/123' \
    --header 'Authorization: Bearer SEU_TOKEN_AQUI' \
    --header 'Content-Type: application/json' \
    --data '{"status":"approved"}'

*/
