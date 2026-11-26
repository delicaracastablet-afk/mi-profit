import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { datosEmpresa } from '../config';

// Función para formatear montos con separador de miles y decimales (Formato Venezolano)
const formatoMoneda = (monto: number) => {
  return monto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- FUNCIÓN PARA FACTURAS (Con IVA) ---
export const generarFacturaPDF = (
  numeroFactura: string,
  rifCliente: string,
  fecha: string,
  productos: any[], 
  cantidad: number,
  precioUnitario: number,
  baseImponible: number,
  iva: number,
  total: number,
  condicion: string,
  vencimiento: string,
  tasaBCV: number,
  totalVES: number
) => {
  const doc = new jsPDF();

  // 1. ENCABEZADO
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(datosEmpresa.nombre, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`RIF: ${datosEmpresa.rif}`, 14, 26);
  doc.text(`Dirección: ${datosEmpresa.direccion}`, 14, 31);
  doc.text(`Teléfono: ${datosEmpresa.telefono}`, 14, 36);
  doc.text(`Tasa BCV: ${formatoMoneda(tasaBCV)} Bs/$`, 14, 41);

  // 2. DATOS DE LA FACTURA
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`FACTURA N°: ${numeroFactura}`, 140, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fecha}`, 140, 26);
  doc.text(`Cliente RIF: ${rifCliente}`, 140, 31);
  doc.text(`Condición: ${condicion.toUpperCase()}`, 140, 36);
  if (condicion === 'credito') {
    doc.text(`Vence: ${vencimiento}`, 140, 41);
  }

  doc.line(14, 45, 196, 45);

  // 3. TABLA DE PRODUCTOS
  const filasProductos = productos.map(p => [
    p.cantidad, 
    p.nombre, 
    `$${formatoMoneda(Number(p.precio))}`, 
    `$${formatoMoneda(Number(p.cantidad) * Number(p.precio))}`
  ]);

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [['Cant.', 'Descripción', 'P. Unit (USD)', 'Total (USD)']],
    body: filasProductos,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // 4. TOTALES (Alineación perfecta en una sola línea)
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9); 
  doc.setFont("helvetica", "normal");

  const xEtiqueta = 90;
  const xUSD = 145;
  const xVES = 195;

  // Base Imponible
  doc.text(`Base Imponible:`, xEtiqueta, finalY);
  doc.text(`$${formatoMoneda(baseImponible)}`, xUSD, finalY, { align: 'right' });
  doc.text(`Bs. ${formatoMoneda(baseImponible * tasaBCV)}`, xVES, finalY, { align: 'right' });

  // IVA
  doc.text(`IVA (16%):`, xEtiqueta, finalY + 6);
  doc.text(`$${formatoMoneda(iva)}`, xUSD, finalY + 6, { align: 'right' });
  doc.text(`Bs. ${formatoMoneda(iva * tasaBCV)}`, xVES, finalY + 6, { align: 'right' });

  // Total a Pagar
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL A PAGAR:`, xEtiqueta, finalY + 15);
  doc.text(`$${formatoMoneda(total)}`, xUSD, finalY + 15, { align: 'right' });
  
  doc.setTextColor(16, 185, 129); // Verde
  doc.text(`Bs. ${formatoMoneda(totalVES)}`, xVES, finalY + 15, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Volver a negro

  // 5. PIE DE PÁGINA
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su compra. Este documento es una representación impresa de una factura electrónica.", 14, 280);

  doc.save(`Factura_${numeroFactura}.pdf`);
};

// --- FUNCIÓN PARA NOTAS DE ENTREGA ---
export const generarNotaEntregaPDF = (
  numeroNota: string,
  rifCliente: string,
  nombreCliente: string,
  fecha: string,
  carrito: any[], 
  totalUSD: number,
  tasaBCV: number 
) => {
  const doc = new jsPDF();

  // 1. ENCABEZADO
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(datosEmpresa.nombre, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`RIF: ${datosEmpresa.rif}`, 14, 26);
  doc.text(`Dirección: ${datosEmpresa.direccion}`, 14, 31);
  doc.text(`Teléfono: ${datosEmpresa.telefono}`, 14, 36);
  doc.text(`Tasa BCV: ${formatoMoneda(tasaBCV)} Bs/$`, 14, 41);

  // 2. DATOS DE LA NOTA
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`NOTA DE ENTREGA N°: ${numeroNota}`, 140, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fecha}`, 140, 26);
  doc.text(`Cliente: ${nombreCliente}`, 140, 31);
  doc.text(`RIF: ${rifCliente}`, 140, 36);

  doc.line(14, 45, 196, 45);

  // 3. TABLA DE PRODUCTOS (Extrae los datos reales del carrito)
  const filasProductos = carrito.map(item => {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precio) || 0;
    const totalFila = cantidad * precio;
    
    return [
      cantidad.toString(), 
      item.nombre, 
      `$${formatoMoneda(precio)}`, 
      `$${formatoMoneda(totalFila)}`
    ];
  });

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [['Cant.', 'Descripción', 'P. Unit (USD)', 'Total (USD)']],
    body: filasProductos,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // 4. TOTALES
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalVES = totalUSD * tasaBCV;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  const xEtiqueta = 80;
  const xUSD = 155;
  const xVES = 195;

  doc.text(`TOTAL A ENTREGAR:`, xEtiqueta, finalY);
  doc.text(`$${formatoMoneda(totalUSD)}`, xUSD, finalY, { align: 'right' });
  
  doc.setTextColor(16, 185, 129); // Verde
  doc.text(`Bs. ${formatoMoneda(totalVES)}`, xVES, finalY, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Volver a negro

  // 5. PIE DE PÁGINA
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Este documento NO es una factura fiscal. No genera IVA ni crédito fiscal.", 14, 280);

  doc.save(`NotaEntrega_${numeroNota}.pdf`);
};