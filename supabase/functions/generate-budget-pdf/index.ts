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

const COLORS = {
  primary: '#2563eb',     // Azul principal
  secondary: '#f8fafc',   // Cinza muito claro
  accent: '#3b82f6',      // Azul mais claro
  text: '#1e293b',        // Azul escuro
  textLight: '#64748b',   // Cinza médio
  success: '#22c55e',     // Verde
  pending: '#f59e0b',     // Laranja
  rejected: '#ef4444',    // Vermelho
  border: '#e2e8f0',      // Cinza claro
  shadow: '#94a3b8'       // Cinza médio para sombras
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

// Função para validar os dados do orçamento
function validateBudget(budget: Budget): void {
  if (!budget.id) throw new Error('ID do orçamento não encontrado');
  if (!budget.client_name) throw new Error('Nome do cliente não encontrado');
  if (!budget.date) throw new Error('Data do orçamento não encontrada');
  if (!Array.isArray(budget.services)) throw new Error('Lista de serviços inválida');
  if (!Array.isArray(budget.materials)) throw new Error('Lista de materiais inválida');
  if (typeof budget.labor_cost !== 'number') throw new Error('Custo de mão de obra inválido');
  if (typeof budget.total_cost !== 'number') throw new Error('Custo total inválido');
}

// Função para gerar o PDF usando jsPDF
async function generatePDF(budget: Budget): Promise<Uint8Array> {
  try {
    // Validar dados do orçamento
    validateBudget(budget);

    const doc = new jsPDF();
    
    // Configurar fonte para suportar caracteres especiais
    doc.setFont("helvetica");

    // Função auxiliar para criar sombras
    const drawShadow = (x: number, y: number, width: number, height: number) => {
      doc.setFillColor(COLORS.shadow);
      doc.setGlobalAlpha(0.1);
      doc.rect(x + 2, y + 2, width, height, 'F');
      doc.setGlobalAlpha(1);
    };

    // Função para obter cor do status
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return COLORS.success;
        case 'pending': return COLORS.pending;
        case 'rejected': return COLORS.rejected;
        default: return COLORS.text;
      }
    };

    /* ------------------------------------------------------------------
     * Cabeçalho
     * ------------------------------------------------------------------ */
    // Faixa superior
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, doc.internal.pageSize.width, 60, 'F');

    // Logo e informações da empresa
    doc.setTextColor('white');
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text('JH Serviços', 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('CNPJ: 26.850.931/0001-72 | Tel: (11) 95224-9455', doc.internal.pageSize.width - 20, 25, { align: 'right' });
    doc.text('Rua Doutor Fritz Martin, 225 - Vila Cruzeiro, São Paulo', doc.internal.pageSize.width - 20, 30, { align: 'right' });

    // Número e Status do Orçamento
    doc.setFillColor(COLORS.secondary);
    drawShadow(20, 70, 170, 50);
    doc.setFillColor('white');
    doc.rect(20, 70, 170, 50, 'F');

    doc.setTextColor(COLORS.text);
    doc.setFontSize(12);
    doc.text('ORÇAMENTO', 30, 85);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`#${budget.id}`, 30, 105);

    // Status
    const statusText = budget.status === 'pending' ? 'PENDENTE' :
                      budget.status === 'approved' ? 'APROVADO' : 'REJEITADO';
    
    doc.setFillColor(getStatusColor(budget.status));
    doc.rect(doc.internal.pageSize.width - 100, 70, 80, 25, 'F');
    doc.setTextColor('white');
    doc.setFontSize(12);
    doc.text(statusText, doc.internal.pageSize.width - 60, 85, { align: 'center' });

    /* ------------------------------------------------------------------
     * Informações do Cliente
     * ------------------------------------------------------------------ */
    // Card de informações
    const clientY = 140;
    drawShadow(20, clientY, doc.internal.pageSize.width - 40, 80);
    doc.setFillColor('white');
    doc.rect(20, clientY, doc.internal.pageSize.width - 40, 80, 'F');

    // Título da seção
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('INFORMAÇÕES DO CLIENTE', 30, clientY + 20);

    // Grid de informações
    doc.setTextColor(COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const infoGrid = [
      ['Cliente:', budget.client_name, 'Data:', new Date(budget.date).toLocaleDateString('pt-BR')],
      ['Endereço:', budget.client_address, 'Local:', budget.work_location],
      ['Cidade:', budget.client_city, 'Tipo:', budget.service_type]
    ];

    let yPos = clientY + 35;
    infoGrid.forEach(row => {
      doc.setFont("helvetica", "bold");
      doc.text(row[0], 30, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(row[1], 80, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(row[2], 160, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(row[3], 190, yPos);
      yPos += 15;
    });

    /* ------------------------------------------------------------------
     * Tabelas de Itens
     * ------------------------------------------------------------------ */
    yPos = 240;

    // Função para criar tabela estilizada
    const createTable = (title: string, items: any[], startY: number) => {
      // Título da seção
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, startY);

      // Cabeçalho da tabela
      const headerY = startY + 10;
      doc.setFillColor(COLORS.primary);
      doc.rect(20, headerY, doc.internal.pageSize.width - 40, 12, 'F');

      doc.setTextColor('white');
      doc.setFontSize(10);
      doc.text('Item', 25, headerY + 8);
      doc.text('Qtd', 130, headerY + 8);
      doc.text('Valor Unit.', 160, headerY + 8);
      doc.text('Total', doc.internal.pageSize.width - 45, headerY + 8);

      // Linhas da tabela
      let currentY = headerY + 12;
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(COLORS.secondary);
          doc.rect(20, currentY, doc.internal.pageSize.width - 40, 12, 'F');
        }

        doc.setTextColor(COLORS.text);
        doc.setFont("helvetica", "normal");
        doc.text(item.name, 25, currentY + 8);
        doc.text(item.quantity.toString(), 130, currentY + 8);
        doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 160, currentY + 8);
        doc.text(`R$ ${item.total.toFixed(2)}`, doc.internal.pageSize.width - 45, currentY + 8);

        currentY += 12;
      });

      return currentY + 10;
    };

    // Renderizar tabelas
    if (budget.services && budget.services.length > 0) {
      yPos = createTable('SERVIÇOS', budget.services, yPos);
    }

    if (budget.materials && budget.materials.length > 0) {
      yPos = createTable('MATERIAIS', budget.materials, yPos + 10);
    }

    /* ------------------------------------------------------------------
     * Totais
     * ------------------------------------------------------------------ */
    // Card de totais
    const totalsWidth = 200;
    const totalsX = doc.internal.pageSize.width - totalsWidth - 20;
    
    drawShadow(totalsX, yPos, totalsWidth, 80);
    doc.setFillColor('white');
    doc.rect(totalsX, yPos, totalsWidth, 80, 'F');

    // Mão de obra
    doc.setTextColor(COLORS.textLight);
    doc.setFontSize(12);
    doc.text('Mão de Obra:', totalsX + 20, yPos + 20);
    doc.setTextColor(COLORS.text);
    doc.text(`R$ ${budget.labor_cost.toFixed(2)}`, totalsX + totalsWidth - 20, yPos + 20, { align: 'right' });

    // Linha divisória
    doc.setDrawColor(COLORS.border);
    doc.line(totalsX + 20, yPos + 40, totalsX + totalsWidth - 20, yPos + 40);

    // Total geral
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('TOTAL:', totalsX + 20, yPos + 60);
    doc.text(`R$ ${budget.total_cost.toFixed(2)}`, totalsX + totalsWidth - 20, yPos + 60, { align: 'right' });

    /* ------------------------------------------------------------------
     * Rodapé
     * ------------------------------------------------------------------ */
    const footerY = doc.internal.pageSize.height - 30;
    doc.setDrawColor(COLORS.border);
    doc.line(20, footerY, doc.internal.pageSize.width - 20, footerY);

    doc.setTextColor(COLORS.textLight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('Este orçamento é válido por 15 dias. Após este período, os valores podem sofrer alterações.', doc.internal.pageSize.width / 2, footerY + 10, { align: 'center' });
    doc.text('JH Serviços © ' + new Date().getFullYear(), doc.internal.pageSize.width / 2, footerY + 20, { align: 'center' });

    // Converter o PDF para Uint8Array
    const pdfBytes = doc.output('arraybuffer');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Erro detalhado na geração do PDF:', error);
    throw new Error(`Falha ao gerar PDF: ${error.message}`);
  }
}

/* Para invocar localmente:

  1. Execute `supabase start` (veja: https://supabase.com/docs/reference/cli/supabase-start)
  2. Faça uma requisição HTTP:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/generate-budget-pdf/123' \
    --header 'Authorization: Bearer SEU_TOKEN_AQUI'

*/
