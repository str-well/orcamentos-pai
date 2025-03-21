import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import express from 'express';
import session from 'express-session';
import { storage } from '../server/storage';
import cors from 'cors';
import { supabase } from '../server/supabase';
import PDFDocument from 'pdfkit';

// Função para gerar PDF e salvar no bucket do Supabase
async function generateAndStorePDF(budget) {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar um documento PDF
      const doc = new PDFDocument();
      const chunks = [];

      // Capturar os chunks do PDF
      doc.on('data', (chunk) => chunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `orcamento-${budget.id}.pdf`;
          
          // Salvar o PDF no bucket do Supabase
          const { data, error } = await supabase
            .storage
            .from('pdfs')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });
            
          if (error) throw error;
          
          // Obter a URL pública do PDF
          const { data: urlData } = supabase
            .storage
            .from('pdfs')
            .getPublicUrl(fileName);
            
          resolve(urlData.publicUrl);
        } catch (error) {
          reject(error);
        }
      });
      
      doc.on('error', reject);

      // Adicionar conteúdo ao PDF
      doc.fontSize(20).text(`Orçamento #${budget.id}`, { align: 'center' });
      doc.moveDown();
      
      // Dados do cliente
      doc.fontSize(14).text('Dados do Cliente');
      doc.fontSize(12).text(`Nome: ${budget.client_name}`);
      doc.text(`Endereço: ${budget.client_address}`);
      doc.text(`Cidade: ${budget.client_city}`);
      doc.text(`Contato: ${budget.client_contact}`);
      doc.moveDown();
      
      // Dados do serviço
      doc.fontSize(14).text('Dados do Serviço');
      doc.fontSize(12).text(`Local: ${budget.work_location}`);
      doc.text(`Tipo: ${budget.service_type}`);
      doc.text(`Data: ${new Date(budget.date).toLocaleDateString('pt-BR')}`);
      doc.moveDown();
      
      // Serviços
      if (budget.services && budget.services.length > 0) {
        doc.fontSize(14).text('Serviços');
        doc.moveDown(0.5);
        
        // Cabeçalho da tabela
        const tableTop = doc.y;
        doc.fontSize(10).text('Serviço', 50, tableTop);
        doc.text('Qtd', 250, tableTop);
        doc.text('Preço Un.', 300, tableTop);
        doc.text('Total', 400, tableTop);
        
        // Linhas da tabela
        let y = tableTop + 20;
        budget.services.forEach(service => {
          doc.fontSize(10).text(service.name, 50, y);
          doc.text(service.quantity.toString(), 250, y);
          doc.text(`R$ ${service.unitPrice}`, 300, y);
          doc.text(`R$ ${service.total}`, 400, y);
          y += 20;
        });
        
        doc.moveDown(2);
      }
      
      // Materiais
      if (budget.materials && budget.materials.length > 0) {
        doc.fontSize(14).text('Materiais');
        doc.moveDown(0.5);
        
        // Cabeçalho da tabela
        const tableTop = doc.y;
        doc.fontSize(10).text('Material', 50, tableTop);
        doc.text('Qtd', 250, tableTop);
        doc.text('Preço Un.', 300, tableTop);
        doc.text('Total', 400, tableTop);
        
        // Linhas da tabela
        let y = tableTop + 20;
        budget.materials.forEach(material => {
          doc.fontSize(10).text(material.name, 50, y);
          doc.text(material.quantity.toString(), 250, y);
          doc.text(`R$ ${material.unitPrice}`, 300, y);
          doc.text(`R$ ${material.total}`, 400, y);
          y += 20;
        });
        
        doc.moveDown(2);
      }
      
      // Totais
      doc.fontSize(12).text(`Mão de Obra: R$ ${budget.labor_cost}`, { align: 'right' });
      doc.fontSize(14).text(`Total: R$ ${budget.total_cost}`, { align: 'right' });
      
      // Finalizar o documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

const app = express();

// Configuração do CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173', // porta padrão do Vite
  credentials: true
}));

// Configuração do middleware de sessão
app.use(
  session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
  })
);

app.use(express.json());

// Registra as rotas da API
await registerRoutes(app);

// Rota para atualizar o status do orçamento
app.put('/api/budgets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Verifique se o status é válido
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    // Atualizar o status no banco de dados
    const { data, error } = await supabase
      .from('budgets')
      .update({ 
        status,
        // Adicionar um campo para rastrear quando o status foi atualizado
        status_updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status do orçamento' });
    }

    return res.json({ success: true, message: `Status atualizado para ${status}` });
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do orçamento' });
  }
});

// Rota para gerar e baixar o PDF
app.get('/api/budgets/:id/pdf', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar o orçamento no banco de dados
    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Verificar se já existe um PDF para este orçamento
    const fileName = `orcamento-${budget.id}.pdf`;
    const { data: existingFile } = await supabase
      .storage
      .from('pdfs')
      .list('', {
        search: fileName
      });

    let pdfUrl;
    
    // Se o PDF já existe, obter a URL pública
    if (existingFile && existingFile.length > 0) {
      const { data: urlData } = supabase
        .storage
        .from('pdfs')
        .getPublicUrl(fileName);
      
      pdfUrl = urlData.publicUrl;
    } else {
      // Se não existe, gerar e salvar o PDF
      pdfUrl = await generateAndStorePDF(budget);
    }

    // Atualizar o orçamento com a URL do PDF
    await supabase
      .from('budgets')
      .update({ 
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Redirecionar para a URL do PDF
    return res.redirect(pdfUrl);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
} 