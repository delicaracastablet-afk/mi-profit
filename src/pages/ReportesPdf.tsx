import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { datosEmpresa } from '../config';

export const ReportesPdf = ({ store }: { store: any }) => {
  const [tipoReporte, setTipoReporte] = useState<'diario' | 'ventas' | 'compras' | 'comprobacion'>('diario');
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

  const generarPDF = () => {
    const doc = new jsPDF();
    const tituloReporte = 
      tipoReporte === 'diario' ? 'LIBRO DIARIO' :
      tipoReporte === 'ventas' ? 'LIBRO DE VENTAS' :
      tipoReporte === 'compras' ? 'LIBRO DE COMPRAS' : 'BALANCE DE COMPROBACIÓN';

    // 1. ENCABEZADO
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(datosEmpresa.nombre, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`RIF: ${datosEmpresa.rif}`, 14, 26);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(tituloReporte, 14, 40);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Desde: ${fechaDesde} | Hasta: ${fechaHasta}`, 14, 46);
    
    doc.line(14, 50, 196, 50);

    // 2. GENERAR DATOS SEGÚN EL REPORTE
    if (tipoReporte === 'diario') {
      const asientosIds = store.getRowIds('asientos');
      const body: any[] = [];

      asientosIds.forEach((id: string) => {
        const fecha = store.getCell('asientos', id, 'fecha');
        if (fecha >= fechaDesde && fecha <= fechaHasta) {
          const desc = store.getCell('asientos', id, 'descripcion');
          body.push([{ content: `${fecha} - ${desc}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
          
          const lineasIds = store.getRowIds('lineas').filter((lid: string) => store.getCell('lineas', lid, 'asientoId') === id);
          lineasIds.forEach((lid: string) => {
            const cuentaId = store.getCell('lineas', lid, 'cuentaId');
            const cod = store.getCell('cuentas', cuentaId, 'codigo');
            const nom = store.getCell('cuentas', cuentaId, 'nombre');
            const debe = Number(store.getCell('lineas', lid, 'debe'));
            const haber = Number(store.getCell('lineas', lid, 'haber'));
            body.push([`${cod} - ${nom}`, debe > 0 ? debe.toFixed(2) : '', haber > 0 ? haber.toFixed(2) : '']);
          });
        }
      });

      autoTable(doc, {
        startY: 55,
        head: [['Cuenta', 'Debe', 'Haber']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] },
      });
    } 
    
    else if (tipoReporte === 'ventas' || tipoReporte === 'compras') {
      const tabla = tipoReporte === 'ventas' ? 'ventas' : 'compras';
      const ids = store.getRowIds(tabla);
      const body: any[] = [];
      
      ids.forEach((id: string) => {
        const fecha = store.getCell(tabla, id, 'fecha');
        if (fecha >= fechaDesde && fecha <= fechaHasta) {
          body.push([
            fecha,
            store.getCell(tabla, id, 'rif'),
            store.getCell(tabla, id, 'numeroFactura'),
            Number(store.getCell(tabla, id, 'baseImponible')).toFixed(2),
            Number(store.getCell(tabla, id, 'iva')).toFixed(2),
            Number(store.getCell(tabla, id, 'total')).toFixed(2)
          ]);
        }
      });

      autoTable(doc, {
        startY: 55,
        head: [['Fecha', 'RIF', 'Factura', 'Base', 'IVA', 'Total']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] },
      });
    }

    else if (tipoReporte === 'comprobacion') {
      const cuentasIds = store.getRowIds('cuentas');
      const body: any[] = [];
      let totalDebe = 0;
      let totalHaber = 0;

      cuentasIds.forEach((id: string) => {
        const cod = store.getCell('cuentas', id, 'codigo');
        const nom = store.getCell('cuentas', id, 'nombre');
        let debe = 0;
        let haber = 0;

        const lineasIds = store.getRowIds('lineas').filter((lid: string) => store.getCell('lineas', lid, 'cuentaId') === id);
        lineasIds.forEach((lid: string) => {
          debe += Number(store.getCell('lineas', lid, 'debe'));
          haber += Number(store.getCell('lineas', lid, 'haber'));
        });

        if (debe > 0 || haber > 0) {
          body.push([`${cod} - ${nom}`, debe.toFixed(2), haber.toFixed(2)]);
          totalDebe += debe;
          totalHaber += haber;
        }
      });

      // Fila de totales
      body.push([{ content: 'TOTALES', styles: { fontStyle: 'bold' } }, { content: totalDebe.toFixed(2), styles: { fontStyle: 'bold' } }, { content: totalHaber.toFixed(2), styles: { fontStyle: 'bold' } }]);

      autoTable(doc, {
        startY: 55,
        head: [['Cuenta', 'Debe', 'Haber']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] },
      });
    }

    // 3. PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Generado por Profit Clone - Sistema Administrativo", 14, 285);

    // Guardar
    doc.save(`${tituloReporte.replace(/ /g, '_')}_${fechaDesde}_${fechaHasta}.pdf`);
  };

  return (
    <div>
      <h2>Generador de Reportes PDF</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Selecciona el reporte, el rango de fechas y descarga el PDF profesional.</p>

      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Tipo de Reporte</label>
          <select value={tipoReporte} onChange={(e: any) => setTipoReporte(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
            <option value="diario">Libro Diario</option>
            <option value="ventas">Libro de Ventas</option>
            <option value="compras">Libro de Compras</option>
            <option value="comprobacion">Balance de Comprobación</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        <button onClick={generarPDF} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>
          Generar y Descargar PDF
        </button>
      </div>
    </div>
  );
};