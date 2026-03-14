import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';

export const generateReceipt = async (saleData: any, itemsData: any, mode: 'detailed' | 'compact' = 'detailed') => {
  const momoRefItems = itemsData.filter((item: any) => item.products?.category === 'Payment Reference');
  const regularItems = itemsData.filter((item: any) => item.products?.category !== 'Payment Reference');
  
  const momoRefText = momoRefItems.length > 0 ? momoRefItems[0].products?.name.replace('MoMo Ref: ', '') : '';

  // Generate PDF
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // POS style paper
  });
  
  const pageWidth = 80;
  
  // Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('HERITAGE MEDICAL DRUG SHOP', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('MALABA, UGANDA', pageWidth / 2, 14, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(mode === 'detailed' ? 'DETAILED RECEIPT' : 'COMPACT SUMMARY', pageWidth / 2, 20, { align: 'center' });
  
  // Transaction ID
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`TXID: ${saleData.id.toUpperCase()}`, pageWidth / 2, 26, { align: 'center' });
  
  // Sale Info
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${format(parseISO(saleData.created_at), 'MMM dd, yyyy HH:mm')}`, 5, 32);
  doc.text(`Cashier: ${saleData.users?.name || 'Staff'}`, 5, 36);
  doc.text(`Payment: ${saleData.payment_method.replace('_', ' ').toUpperCase()}`, 5, 40);
  
  let currentY = 44;
  if (momoRefText) {
    doc.text(`MoMo Ref: ${momoRefText}`, 5, currentY);
    currentY += 4;
  }

  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 5;

  if (mode === 'detailed') {
    // Detailed Items Table
    doc.setFont("helvetica", "bold");
    doc.text('Item', 5, currentY);
    doc.text('Qty', 45, currentY);
    doc.text('Total', pageWidth - 5, currentY, { align: 'right' });
    currentY += 4;
    doc.setFont("helvetica", "normal");
    
    regularItems.forEach((item: any) => {
      const name = item.products?.name || 'Unknown Item';
      const qty = item.quantity.toString();
      const total = item.total_price.toLocaleString();
      
      // Handle long names
      const splitName = doc.splitTextToSize(name, 38);
      doc.text(splitName, 5, currentY);
      doc.text(qty, 45, currentY);
      doc.text(total, pageWidth - 5, currentY, { align: 'right' });
      
      currentY += (splitName.length * 4);
      
      if (currentY > 140) doc.addPage();
    });
  } else {
    // Compact Summary
    doc.setFont("helvetica", "bold");
    doc.text('Items Summary:', 5, currentY);
    currentY += 4;
    doc.setFont("helvetica", "normal");
    
    const itemNames = regularItems.map((item: any) => item.products?.name).join(', ');
    const splitNames = doc.splitTextToSize(itemNames, pageWidth - 10);
    doc.text(splitNames, 5, currentY);
    currentY += (splitNames.length * 4);
  }

  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 6;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: UGX ${saleData.total_amount.toLocaleString()}`, pageWidth - 5, currentY, { align: 'right' });
  
  currentY += 10;
  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text('Thank you for your business!', pageWidth / 2, currentY, { align: 'center' });
  doc.text('Quick Recovery!', pageWidth / 2, currentY + 4, { align: 'center' });

  // Save PDF
  doc.save(`Receipt_${saleData.id.slice(0, 8)}_${mode}.pdf`);
};
