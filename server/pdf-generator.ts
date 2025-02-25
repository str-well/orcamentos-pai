import PDFDocument from "pdfkit";
import { type Budget } from "@shared/schema";

interface TableRow {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function generateBudgetPDF(budget: Budget): Buffer {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('Orçamento', { align: 'center' });
      doc.moveDown();

      // Cliente Info
      doc.fontSize(14).text('Informações do Cliente');
      doc.fontSize(10)
        .text(`Nome: ${budget.clientName}`)
        .text(`Endereço: ${budget.clientAddress}`)
        .text(`Cidade: ${budget.clientCity}`)
        .text(`Contato: ${budget.clientContact}`);
      doc.moveDown();

      // Trabalho Info
      doc.fontSize(14).text('Informações do Trabalho');
      doc.fontSize(10)
        .text(`Local: ${budget.workLocation}`)
        .text(`Tipo de Serviço: ${budget.serviceType}`)
        .text(`Data: ${new Date(budget.date).toLocaleDateString()}`);
      doc.moveDown();

      // Services Table
      doc.fontSize(14).text('Serviços');
      createTable(doc, budget.services || []);
      doc.moveDown();

      // Materials Table
      doc.fontSize(14).text('Materiais');
      createTable(doc, budget.materials || []);
      doc.moveDown();

      // Totals
      doc.fontSize(12)
        .text(`Mão de Obra: R$ ${budget.laborCost}`, { align: 'right' })
        .text(`Valor Total: R$ ${budget.totalCost}`, { align: 'right' });

      // Footer
      doc.fontSize(8)
        .text(
          'Este orçamento tem validade de 30 dias.',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function createTable(doc: PDFKit.PDFDocument, items: TableRow[]) {
  const tableTop = doc.y;
  const columns = {
    name: { x: 50, width: 200 },
    quantity: { x: 250, width: 80 },
    unitPrice: { x: 330, width: 80 },
    total: { x: 410, width: 80 }
  };

  // Table Header
  doc.fontSize(10)
    .text('Item', columns.name.x, tableTop)
    .text('Qtd', columns.quantity.x, tableTop)
    .text('Preço Un.', columns.unitPrice.x, tableTop)
    .text('Total', columns.total.x, tableTop);

  let rowTop = tableTop + 20;

  // Table Rows
  items.forEach(item => {
    doc.text(item.name, columns.name.x, rowTop)
      .text(item.quantity.toString(), columns.quantity.x, rowTop)
      .text(`R$ ${item.unitPrice}`, columns.unitPrice.x, rowTop)
      .text(`R$ ${item.total}`, columns.total.x, rowTop);
    rowTop += 20;
  });

  // Table Border
  doc.rect(50, tableTop - 5, 440, rowTop - tableTop + 5).stroke();
}
