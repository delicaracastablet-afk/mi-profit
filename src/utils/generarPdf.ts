import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { datosEmpresa } from '../config';

export const generarFacturaPDF = (
  numeroFactura: string,
  rifCliente: string,
  fecha: string,
  productoNombre: string,
  cantidad: number,
  precioUnitario: number,
  baseImponible: number,
  iva: number,
  total: number
) => {
  const doc = new jsPDF();

  // 1. ENCABEZADO (Datos de la empresa)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(datosEmpresa.nombre, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`RIF: ${datosEmpresa.rif}`, 14, 26);
  doc.text(`Dirección: ${datosEmpresa.direccion}`, 14, 31);
  doc.text(`Teléfono: ${datosEmpresa.telefono}`, 14, 36);

  // 2. DATOS DE LA FACTURA
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`FACTURA N°: ${numeroFactura}`, 140, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fecha}`, 140, 26);
  doc.text(`Cliente RIF: ${rifCliente}`, 140, 31);

  // Línea separadora
  doc.line(14, 45, 196, 45);

  // 3. TABLA DE PRODUCTOS (Usando autoTable)
  autoTable(doc, {
    startY: 50,
    head: [['Cantidad', 'Descripción', 'Precio Unitario', 'Total']],
    body: [
      [cantidad.toString(), productoNombre, `$${precioUnitario.toFixed(2)}`, `$${(cantidad * precioUnitario).toFixed(2)}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] }, // Azul de tu app
  });

  // 4. TOTALES
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Base Imponible:`, 140, finalY);
  doc.text(`$${baseImponible.toFixed(2)}`, 190, finalY, { align: 'right' });
  
  doc.text(`IVA (16%):`, 140, finalY + 6);
  doc.text(`$${iva.toFixed(2)}`, 190, finalY + 6, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL A PAGAR:`, 140, finalY + 14);
  doc.text(`$${total.toFixed(2)}`, 190, finalY + 14, { align: 'right' });

  // 5. PIE DE PÁGINA
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su compra. Este documento es una representación impresa de una factura electrónica.", 14, 280);

  // Guardar el PDF
  doc.save(`Factura_${numeroFactura}.pdf`);
};