import PDFDocument from "pdfkit";
import { type Budget } from "@shared/schema";

interface TableRow {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const COLORS = {
  primary: '#2563eb', // Azul
  secondary: '#f3f4f6', // Cinza claro
  text: '#1f2937', // Cinza escuro
};

export async function generateBudgetPDF(budget: Budget): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      /* ------------------------------------------------------------------
       * Cabeçalho com título
       * ------------------------------------------------------------------ */
      doc.rect(0, 0, doc.page.width, 100)
         .fill(COLORS.primary);

      doc.fontSize(24)
         .fillColor('white')
         .text('Orçamento', 50, 35, { align: 'center' });

      /* ------------------------------------------------------------------
       * Dados da Empresa com efeito 3D
       * ------------------------------------------------------------------ */
      // Sombra do card
      doc.rect(52, 110, 500, 80)
         .fill('#e2e8f0');
      
      doc.rect(50, 108, 500, 80)
         .fill(COLORS.secondary);

      doc.fontSize(11)
         .fillColor(COLORS.text)
         .text('JH Serviços', 65, 120)
         .fontSize(9)
         .text('CNPJ: 26.850.931/0001-72', 65, 135)
         .text('Rua Doutor Fritz Martin, 225 - Vila Cruzeiro, São Paulo', 65, 150)
         .text('(11) 95224-9455 | Email: jh-servicos@hotmail.com', 65, 165);

      /* ------------------------------------------------------------------
       * Box de Informações com efeito 3D
       * ------------------------------------------------------------------ */
      // Sombra do card
      doc.rect(52, 202, 500, 180)
         .fill('#e2e8f0');
      
      doc.rect(50, 200, 500, 180)
         .fill(COLORS.secondary);

      // Informações do Cliente
      doc.fontSize(12)
         .fillColor(COLORS.text)
         .font('Helvetica-Bold')
         .text('Informações do cliente', 65, 215);

      doc.font('Helvetica')
         .fontSize(9)
         .text(`Nome: ${budget.clientName}`, 65, 235)
         .text(`Endereço: ${budget.clientAddress}`, 65, 250)
         .text(`Cidade: ${budget.clientCity}`, 65, 265)
         .text(`Contato: ${budget.clientContact}`, 65, 280);

      // Linha divisória
      doc.moveTo(65, 300).lineTo(535, 300).stroke();

      // Detalhes do Serviço
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Detalhes do serviço', 65, 315);

      doc.font('Helvetica')
         .fontSize(9)
         .text(`Local: ${budget.workLocation}`, 65, 335)
         .text(`Tipo de Serviço: ${budget.serviceType}`, 65, 350)
         .text(`Data: ${new Date(budget.date).toLocaleDateString('pt-BR')}`, 65, 365);

      doc.moveDown(2);

      /* ------------------------------------------------------------------
       * Serviços e Materiais
       * ------------------------------------------------------------------ */
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(COLORS.text)
         .text('Serviços', 50, doc.y);

      createStyledTable(doc, budget.services || []);
      doc.moveDown();

      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(COLORS.text)
         .text('Materiais', 50, doc.y);

      createStyledTable(doc, budget.materials || []);
      doc.moveDown();

      /* ------------------------------------------------------------------
       * Totais Destacados com efeito 3D
       * ------------------------------------------------------------------ */
      const totalsY = doc.y;
      doc.rect(352, totalsY, 200, 50)
         .fill('#e2e8f0');
      
      doc.rect(350, totalsY - 2, 200, 50)
         .fill(COLORS.secondary);

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(COLORS.text)
         .text(`Mão de Obra: R$ ${budget.laborCost}`, 360, totalsY + 10)
         .text(`Total: R$ ${budget.totalCost}`, 360, totalsY + 30);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/* ==========================================================================
 * Função: createStyledTable
 * Cria uma tabela com cabeçalho azul e linhas alternadas
 * ========================================================================== */
function createStyledTable(doc: PDFKit.PDFDocument, items: TableRow[]) {
  const tableTop = doc.y + 10;
  const columns = {
    name: { x: 50, width: 200 },
    quantity: { x: 250, width: 80 },
    unitPrice: { x: 330, width: 100 },
    total: { x: 430, width: 100 }
  };

  // Cabeçalho azul
  doc.rect(50, tableTop - 5, 480, 25)
     .fill(COLORS.primary);

  doc.fillColor('white')
     .fontSize(9)
     .text('Item', columns.name.x + 5, tableTop)
     .text('Qtd', columns.quantity.x + 5, tableTop)
     .text('Preço Un.', columns.unitPrice.x + 5, tableTop)
     .text('Total', columns.total.x + 5, tableTop);

  let rowTop = tableTop + 25;

  // Linhas da tabela
  items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.rect(50, rowTop - 5, 480, 25)
         .fill(COLORS.secondary);
    }

    doc.font('Helvetica')
       .fillColor(COLORS.text)
       .text(item.name, columns.name.x + 5, rowTop)
       .text(item.quantity.toString(), columns.quantity.x + 5, rowTop)
       .text(`R$ ${item.unitPrice.toFixed(2)}`, columns.unitPrice.x + 5, rowTop)
       .text(`R$ ${item.total.toFixed(2)}`, columns.total.x + 5, rowTop);

    rowTop += 25;
  });

  // Borda final
  doc.rect(50, tableTop - 5, 480, rowTop - tableTop + 5)
     .strokeColor(COLORS.primary)
     .stroke();

  doc.y = rowTop + 10;
}
