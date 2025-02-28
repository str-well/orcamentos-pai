import PDFDocument from "pdfkit";
import { type Budget } from "../shared/schema.js";

interface TableRow {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const COLORS = {
  primary: '#2563eb',
  secondary: '#f3f4f6',
  text: '#1f2937',
  lightBlue: '#e5edff',
  border: '#e2e8f0',
  success: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
};

const FONTS = {
  bold: 'Helvetica-Bold',
  normal: 'Helvetica',
};

export async function generateBudgetPDF(budget: Budget): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Funções auxiliares para o layout
      const drawHorizontalLine = (y: number) => {
        doc.strokeColor(COLORS.border)
           .moveTo(50, y)
           .lineTo(doc.page.width - 50, y)
           .stroke();
      };

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
      // Fundo do cabeçalho
      doc.rect(0, 0, doc.page.width, 150)
         .fill(COLORS.primary);

      // Logo e informações da empresa (lado esquerdo)
      doc.font(FONTS.bold)
         .fontSize(24)
         .fillColor('white')
         .text('JH Serviços', 50, 40);

      doc.font(FONTS.normal)
         .fontSize(10)
         .moveDown(0.5)
         .text('CNPJ: 26.850.931/0001-72')
         .moveDown(0.2)
         .text('Rua Doutor Fritz Martin, 225')
         .moveDown(0.2)
         .text('Vila Cruzeiro, São Paulo')
         .moveDown(0.2)
         .text('(11) 95224-9455')
         .moveDown(0.2)
         .text('jh-servicos@hotmail.com');

      // Número do orçamento (lado direito)
      doc.font(FONTS.bold)
         .fontSize(40)
         .text(`#${budget.id}`, 400, 40, { align: 'right' });

      doc.font(FONTS.normal)
         .fontSize(12)
         .text('ORÇAMENTO', 400, 85, { align: 'right' });

      const statusText = budget.status === 'pending' ? 'PENDENTE' :
                        budget.status === 'approved' ? 'APROVADO' : 'REJEITADO';

      doc.font(FONTS.bold)
         .fontSize(14)
         .fillColor(getStatusColor(budget.status))
         .text(statusText, 400, 105, { align: 'right' });

      /* ------------------------------------------------------------------
       * Informações do Cliente
       * ------------------------------------------------------------------ */
      // Card com informações do cliente
      const clientInfoY = 180;
      doc.rect(50, clientInfoY, doc.page.width - 100, 120)
         .fill(COLORS.lightBlue);

      doc.fillColor(COLORS.text)
         .font(FONTS.bold)
         .fontSize(14)
         .text('Informações do Cliente', 70, clientInfoY + 15);

      doc.font(FONTS.normal)
         .fontSize(10)
         .moveDown(1);

      // Grid de informações do cliente
      const clientGrid = [
        ['Cliente:', budget.clientName, 'Data:', new Date(budget.date).toLocaleDateString('pt-BR')],
        ['Endereço:', budget.clientAddress, 'Local:', budget.workLocation],
        ['Cidade:', budget.clientCity, 'Tipo:', budget.serviceType],
        ['Contato:', budget.clientContact, '', '']
      ];

      let currentY = clientInfoY + 40;
      clientGrid.forEach(row => {
        doc.font(FONTS.bold)
           .text(row[0], 70, currentY)
           .font(FONTS.normal)
           .text(row[1], 140, currentY)
           .font(FONTS.bold)
           .text(row[2], 350, currentY)
           .font(FONTS.normal)
           .text(row[3], 400, currentY);
        currentY += 20;
      });

      /* ------------------------------------------------------------------
       * Tabelas de Serviços e Materiais
       * ------------------------------------------------------------------ */
      let yPos = 330;

      // Função para desenhar tabela
      const drawTable = (title: string, items: TableRow[], startY: number) => {
        // Título da seção
        doc.font(FONTS.bold)
           .fontSize(14)
           .fillColor(COLORS.text)
           .text(title, 50, startY);

        // Cabeçalho da tabela
        const headerY = startY + 25;
        doc.rect(50, headerY, doc.page.width - 100, 30)
           .fill(COLORS.primary);

        doc.fillColor('white')
           .fontSize(10)
           .text('Item', 70, headerY + 10)
           .text('Qtd', 350, headerY + 10)
           .text('Preço Un.', 420, headerY + 10)
           .text('Total', 490, headerY + 10);

        // Linhas da tabela
        let currentY = headerY + 30;
        items.forEach((item, index) => {
          if (index % 2 === 0) {
            doc.rect(50, currentY, doc.page.width - 100, 25)
               .fill(COLORS.lightBlue);
          }

          doc.fillColor(COLORS.text)
             .font(FONTS.normal)
             .text(item.name, 70, currentY + 7)
             .text(item.quantity.toString(), 350, currentY + 7)
             .text(`R$ ${item.unitPrice.toFixed(2)}`, 420, currentY + 7)
             .text(`R$ ${item.total.toFixed(2)}`, 490, currentY + 7);

          currentY += 25;
        });

        return currentY;
      };

      // Desenhar tabela de serviços
      if (budget.services && budget.services.length > 0) {
        yPos = drawTable('Serviços', budget.services, yPos);
        yPos += 30;
      }

      // Desenhar tabela de materiais
      if (budget.materials && budget.materials.length > 0) {
        yPos = drawTable('Materiais', budget.materials, yPos);
        yPos += 30;
      }

      /* ------------------------------------------------------------------
       * Totais e Observações
       * ------------------------------------------------------------------ */
      // Card de totais
      doc.rect(doc.page.width - 250, yPos, 200, 100)
         .fill(COLORS.lightBlue);

      doc.font(FONTS.normal)
         .fontSize(12)
         .fillColor(COLORS.text)
         .text('Mão de Obra:', doc.page.width - 230, yPos + 20)
         .text(`R$ ${Number(budget.laborCost).toFixed(2)}`, doc.page.width - 100, yPos + 20, { align: 'right' });

      drawHorizontalLine(yPos + 50);

      doc.font(FONTS.bold)
         .fontSize(16)
         .text('Total:', doc.page.width - 230, yPos + 60)
         .text(`R$ ${Number(budget.totalCost).toFixed(2)}`, doc.page.width - 100, yPos + 60, { align: 'right' });

      // Rodapé
      const footerY = doc.page.height - 50;
      drawHorizontalLine(footerY);
      
      doc.font(FONTS.normal)
         .fontSize(8)
         .text('Este orçamento é válido por 15 dias. Após este período, os valores podem sofrer alterações.', 50, footerY + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
