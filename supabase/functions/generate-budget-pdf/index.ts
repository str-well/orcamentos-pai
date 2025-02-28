// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { Buffer } from "https://deno.land/std@0.208.0/io/buffer.ts";

console.log("Generate Budget PDF Function Started!")

// Configuração dos cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Interface para o orçamento
interface Budget {
  id: string;
  client_name: string;
  client_address: string;
  client_city: string;
  client_contact: string;
  work_location: string;
  service_type: string;
  date: string;
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  materials: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  labor_cost: number;
  total_cost: number;
  status: string;
}

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

    // Buscar dados do orçamento
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (budgetError || !budget) {
      console.error('Erro ao buscar orçamento:', budgetError);
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Gerar PDF usando uma biblioteca ou serviço
    // Aqui vamos simular a geração do PDF e upload para o Storage do Supabase
    
    // Criar um arquivo PDF simples (simulação)
    const pdfContent = await generatePDF(budget);
    
    // Nome do arquivo
    const fileName = `orcamento_${budgetId}_${Date.now()}.pdf`;
    
    // Fazer upload do PDF para o Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('pdfs')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do PDF:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload do PDF' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Obter URL pública do PDF
    const { data: urlData } = await supabase
      .storage
      .from('pdfs')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Atualizar o registro do orçamento com a URL do PDF
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', budgetId);

    if (updateError) {
      console.error('Erro ao atualizar orçamento:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar orçamento com URL do PDF' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Retornar resposta com URL do PDF
    const data = {
      message: `PDF para orçamento ${budgetId} gerado com sucesso!`,
      budgetId: budgetId,
      pdfUrl: pdfUrl,
    };

    // Redirecionar para o PDF
    return new Response(
      JSON.stringify(data),
      { 
        headers: {
          ...corsHeaders,
          'Location': pdfUrl
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar o PDF' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Função para gerar o PDF (simulação)
async function generatePDF(budget: Budget): Promise<Uint8Array> {
  // Aqui você usaria uma biblioteca como PDFKit ou jsPDF para gerar o PDF
  // Por enquanto, vamos apenas criar um buffer com texto simples
  
  // Simulação de conteúdo PDF
  const pdfText = `
    ORÇAMENTO #${budget.id}
    
    Cliente: ${budget.client_name}
    Endereço: ${budget.client_address}, ${budget.client_city}
    Contato: ${budget.client_contact}
    
    Local do Serviço: ${budget.work_location}
    Tipo de Serviço: ${budget.service_type}
    Data: ${budget.date}
    
    SERVIÇOS:
    ${budget.services.map(s => `- ${s.name}: ${s.quantity} x R$ ${s.unitPrice} = R$ ${s.total}`).join('\n')}
    
    MATERIAIS:
    ${budget.materials.map(m => `- ${m.name}: ${m.quantity} x R$ ${m.unitPrice} = R$ ${m.total}`).join('\n')}
    
    Custo de Mão de Obra: R$ ${budget.labor_cost}
    
    TOTAL: R$ ${budget.total_cost}
  `;
  
  // Converter texto para Uint8Array
  return new TextEncoder().encode(pdfText);
}

/* Para invocar localmente:

  1. Execute `supabase start` (veja: https://supabase.com/docs/reference/cli/supabase-start)
  2. Faça uma requisição HTTP:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/generate-budget-pdf/123' \
    --header 'Authorization: Bearer SEU_TOKEN_AQUI'

*/
