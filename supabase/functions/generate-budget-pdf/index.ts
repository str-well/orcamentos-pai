// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
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

const COLORS = {
  primary: '#2563eb', // Azul
  secondary: '#f3f4f6', // Cinza claro
  text: '#1f2937', // Cinza escuro
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

// Função para gerar o PDF usando jsPDF
async function generatePDF(budget: Budget): Promise<Uint8Array> {
  const doc = new jsPDF();
  
  // Configurar fonte para suportar caracteres especiais
  doc.setFont("helvetica");
  
  /* ------------------------------------------------------------------
   * Cabeçalho com título
   * ------------------------------------------------------------------ */
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('Orçamento', doc.internal.pageSize.width / 2, 25, { align: 'center' });

  /* ------------------------------------------------------------------
   * Dados da Empresa
   * ------------------------------------------------------------------ */
  doc.setFillColor(COLORS.secondary);
  doc.rect(20, 50, doc.internal.pageSize.width - 40, 40, 'F');

  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.text('JH Serviços', 25, 60);
  doc.setFontSize(9);
  doc.text('CNPJ: 26.850.931/0001-72', 25, 70);
  doc.text('Rua Doutor Fritz Martin, 225 - Vila Cruzeiro, São Paulo', 25, 80);
  doc.text('(11) 95224-9455 | Email: jh-servicos@hotmail.com', 25, 90);

  /* ------------------------------------------------------------------
   * Box de Informações
   * ------------------------------------------------------------------ */
  doc.setFillColor(COLORS.secondary);
  doc.rect(20, 100, doc.internal.pageSize.width - 40, 80, 'F');

  // Informações do Cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Informações do cliente', 25, 110);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nome: ${budget.client_name}`, 25, 120);
  doc.text(`Endereço: ${budget.client_address}`, 25, 130);
  doc.text(`Cidade: ${budget.client_city}`, 25, 140);
  doc.text(`Contato: ${budget.client_contact}`, 25, 150);

  // Linha divisória
  doc.setDrawColor(COLORS.primary);
  doc.line(25, 160, doc.internal.pageSize.width - 25, 160);

  // Detalhes do Serviço
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Detalhes do serviço', 25, 170);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Local: ${budget.work_location}`, 25, 180);
  doc.text(`Tipo de Serviço: ${budget.service_type}`, 25, 190);
  doc.text(`Data: ${new Date(budget.date).toLocaleDateString('pt-BR')}`, 25, 200);

  /* ------------------------------------------------------------------
   * Tabelas de Serviços e Materiais
   * ------------------------------------------------------------------ */
  let yPos = 220;

  // Tabela de Serviços
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Serviços', 25, yPos);
  yPos += 10;

  // Cabeçalho da tabela
  doc.setFillColor(COLORS.primary);
  doc.rect(20, yPos, doc.internal.pageSize.width - 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Item', 25, yPos + 7);
  doc.text('Qtd', 100, yPos + 7);
  doc.text('Preço Un.', 130, yPos + 7);
  doc.text('Total', 170, yPos + 7);
  yPos += 15;

  // Linhas da tabela de serviços
  doc.setTextColor(COLORS.text);
  budget.services.forEach((service, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(COLORS.secondary);
      doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 10, 'F');
    }
    doc.text(service.name, 25, yPos);
    doc.text(service.quantity.toString(), 100, yPos);
    doc.text(`R$ ${service.unitPrice.toFixed(2)}`, 130, yPos);
    doc.text(`R$ ${service.total.toFixed(2)}`, 170, yPos);
    yPos += 10;
  });

  yPos += 10;

  // Tabela de Materiais
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Materiais', 25, yPos);
  yPos += 10;

  // Cabeçalho da tabela
  doc.setFillColor(COLORS.primary);
  doc.rect(20, yPos, doc.internal.pageSize.width - 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Item', 25, yPos + 7);
  doc.text('Qtd', 100, yPos + 7);
  doc.text('Preço Un.', 130, yPos + 7);
  doc.text('Total', 170, yPos + 7);
  yPos += 15;

  // Linhas da tabela de materiais
  doc.setTextColor(COLORS.text);
  budget.materials.forEach((material, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(COLORS.secondary);
      doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 10, 'F');
    }
    doc.text(material.name, 25, yPos);
    doc.text(material.quantity.toString(), 100, yPos);
    doc.text(`R$ ${material.unitPrice.toFixed(2)}`, 130, yPos);
    doc.text(`R$ ${material.total.toFixed(2)}`, 170, yPos);
    yPos += 10;
  });

  yPos += 20;

  /* ------------------------------------------------------------------
   * Totais
   * ------------------------------------------------------------------ */
  doc.setFillColor(COLORS.secondary);
  doc.rect(doc.internal.pageSize.width - 90, yPos - 5, 70, 30, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text(`Mão de Obra: R$ ${budget.labor_cost.toFixed(2)}`, doc.internal.pageSize.width - 85, yPos + 5);
  doc.text(`Total: R$ ${budget.total_cost.toFixed(2)}`, doc.internal.pageSize.width - 85, yPos + 20);

  // Converter o PDF para Uint8Array
  const pdfBytes = doc.output('arraybuffer');
  return new Uint8Array(pdfBytes);
}

/* Para invocar localmente:

  1. Execute `supabase start` (veja: https://supabase.com/docs/reference/cli/supabase-start)
  2. Faça uma requisição HTTP:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/generate-budget-pdf/123' \
    --header 'Authorization: Bearer SEU_TOKEN_AQUI'

*/
