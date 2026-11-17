import { useRowIds } from 'tinybase/ui-react';

export const LibrosFiscales = ({ store }: { store: any }) => {
  const ventasIds = useRowIds('ventas', store);
  const comprasIds = useRowIds('compras', store);

  const exportarCSV = (tabla: string, nombreArchivo: string) => {
    const ids = store.getRowIds(tabla);
    if (ids.length === 0) return;
    const primeraFila = store.getRow(tabla, ids[0]);
    const cabeceras = Object.keys(primeraFila);
    const filas = ids.map((id: string) => {
      const fila = store.getRow(tabla, id);
      return cabeceras.map(cab => {
        const val = fila[cab];
        return typeof val === 'number' ? val.toFixed(2) : val;
      }).join(';');
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [cabeceras.join(';'), ...filas].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h2>Libros Fiscales</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* VENTAS */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Libro de Ventas</h3>
            <button onClick={() => exportarCSV('ventas', 'libro_ventas')} disabled={ventasIds.length === 0} style={{ backgroundColor: ventasIds.length > 0 ? '#10b981' : '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>Exportar CSV</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', fontSize: '12px' }}>
            <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th><th style={{ textAlign: 'left', padding: '10px' }}>Factura</th><th style={{ textAlign: 'right', padding: '10px' }}>Total</th></tr></thead>
            <tbody>
              {ventasIds.length === 0 ? <tr><td colSpan={3} style={{ padding: '10px', textAlign: 'center', color: '#888' }}>No hay ventas</td></tr> : ventasIds.map((id: string) => {
                const v = store.getRow('ventas', id);
                return <tr key={id} style={{ borderBottom: '1px solid #444' }}><td style={{ padding: '10px' }}>{v.fecha}</td><td style={{ padding: '10px' }}>{v.numeroFactura}</td><td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>{Number(v.total).toFixed(2)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>

        {/* COMPRAS */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Libro de Compras</h3>
            <button onClick={() => exportarCSV('compras', 'libro_compras')} disabled={comprasIds.length === 0} style={{ backgroundColor: comprasIds.length > 0 ? '#10b981' : '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>Exportar CSV</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', fontSize: '12px' }}>
            <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th><th style={{ textAlign: 'left', padding: '10px' }}>Factura</th><th style={{ textAlign: 'right', padding: '10px' }}>Total</th></tr></thead>
            <tbody>
              {comprasIds.length === 0 ? <tr><td colSpan={3} style={{ padding: '10px', textAlign: 'center', color: '#888' }}>No hay compras</td></tr> : comprasIds.map((id: string) => {
                const c = store.getRow('compras', id);
                return <tr key={id} style={{ borderBottom: '1px solid #444' }}><td style={{ padding: '10px' }}>{c.fecha}</td><td style={{ padding: '10px' }}>{c.numeroFactura}</td><td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>{Number(c.total).toFixed(2)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};