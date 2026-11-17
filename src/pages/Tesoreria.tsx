import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Tesoreria = ({ store }: { store: any }) => {
  const [tipoOperacion, setTipoOperacion] = useState<'cobro' | 'pago'>('cobro');
  const [documentoId, setDocumentoId] = useState('');
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Banco');

  const ventasIds = useRowIds('ventas', store);
  const comprasIds = useRowIds('compras', store);

  // Filtramos las facturas que aún tienen saldo pendiente
  const facturasPendientes = tipoOperacion === 'cobro' 
    ? ventasIds.filter((id: string) => Number(store.getCell('ventas', id, 'total')) > 0) // Aquí podríamos restar abonos anteriores
    : comprasIds.filter((id: string) => Number(store.getCell('compras', id, 'total')) > 0);

  const procesarTransaccion = () => {
    if (!documentoId || monto <= 0) return alert("Seleccione un documento y un monto válido.");

    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };

    // Cuentas contables necesarias
    const cBanco = buscarOCrearCuenta('1102', 'Banco', 'Activo');
    const cCaja = buscarOCrearCuenta('1101', 'Caja', 'Activo');
    
    // La cuenta a afectar depende de si es cobro o pago
    const cuentaTesoreria = metodoPago === 'Banco' ? cBanco : cCaja;

    const asientoId = store.addRow('asientos', { 
      fecha: new Date().toISOString().split('T')[0], 
      descripcion: `${tipoOperacion === 'cobro' ? 'Cobro' : 'Pago'} de factura` 
    });

    if (tipoOperacion === 'cobro') {
      const cClientes = buscarOCrearCuenta('1201', 'Clientes', 'Activo');
      // Cobro: Entra dinero (Debe Banco), baja la deuda del cliente (Haber Clientes)
      store.addRow('lineas', { asientoId, cuentaId: cuentaTesoreria, debe: monto, haber: 0 });
      store.addRow('lineas', { asientoId, cuentaId: cClientes, debe: 0, haber: monto });
    } else {
      const cProveedores = buscarOCrearCuenta('2101', 'Proveedores', 'Pasivo');
      // Pago: Baja nuestra deuda (Debe Proveedores), sale dinero (Haber Banco)
      store.addRow('lineas', { asientoId, cuentaId: cProveedores, debe: monto, haber: 0 });
      store.addRow('lineas', { asientoId, cuentaId: cuentaTesoreria, debe: 0, haber: monto });
    }

    setMonto(0);
    setDocumentoId('');
    alert(`¡${tipoOperacion === 'cobro' ? 'Cobro' : 'Pago'} registrado con éxito!`);
  };

  return (
    <div>
      <h2>Tesorería: Cobros y Pagos</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Registra abonos a facturas de venta (Cobros) o de compra (Pagos).</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setTipoOperacion('cobro'); setDocumentoId(''); }} 
          style={{ padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: tipoOperacion === 'cobro' ? '#10b981' : '#333', color: 'white' }}
        >
          💰 Registrar Cobro (Clientes)
        </button>
        <button 
          onClick={() => { setTipoOperacion('pago'); setDocumentoId(''); }} 
          style={{ padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: tipoOperacion === 'pago' ? '#f43f5e' : '#333', color: 'white' }}
        >
          💸 Registrar Pago (Proveedores)
        </button>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Seleccione la Factura</label>
          <select value={documentoId} onChange={(e) => setDocumentoId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
            <option value="">Selecciona una factura...</option>
            {facturasPendientes.map((id: string) => {
              const tabla = tipoOperacion === 'cobro' ? 'ventas' : 'compras';
              const factura = store.getRow(tabla, id);
              return (
                <option key={id} value={id}>
                  Factura #{factura.numeroFactura} - Total: {Number(factura.total).toFixed(2)} {tipoOperacion === 'cobro' ? `(Cliente: ${factura.rif})` : `(Proveedor: ${factura.rif})`}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Monto a {tipoOperacion === 'cobro' ? 'Cobrar' : 'Pagar'}</label>
            <input type="number" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Método</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="Banco">Transferencia / Pago Móvil (Banco)</option>
              <option value="Caja">Efectivo (Caja)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={procesarTransaccion} 
          disabled={!documentoId || monto <= 0} 
          style={{ backgroundColor: (documentoId && monto > 0) ? (tipoOperacion === 'cobro' ? '#10b981' : '#f43f5e') : '#555', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}
        >
          Confirmar {tipoOperacion === 'cobro' ? 'Cobro' : 'Pago'}
        </button>
      </div>
    </div>
  );
};