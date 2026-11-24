import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Tesoreria = ({ store }: { store: any }) => {
  const [tipoOperacion, setTipoOperacion] = useState<'cobro' | 'pago'>('cobro');
  const [documentoId, setDocumentoId] = useState('');
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Banco');

  const ventasIds = useRowIds('ventas', store);
  const comprasIds = useRowIds('compras', store);

  // --- LÓGICA PARA CALCULAR EL SALDO PENDIENTE ---
  const calcularSaldoPendiente = (idFactura: string, tabla: 'ventas' | 'compras') => {
    const factura = store.getRow(tabla, idFactura);
    const totalFactura = Number(factura.total);

    // Buscamos todos los abonos que se hayan hecho para esta factura
    let totalAbonado = 0;
    const asientosIds = store.getRowIds('asientos');
    
    asientosIds.forEach((asientoId: string) => {
      const descripcion = store.getCell('asientos', asientoId, 'descripcion');
      
      // Validamos si el asiento corresponde a un cobro/pago de esta factura
      const esCobroDeEstaFactura = tipoOperacion === 'cobro' && descripcion.includes(`Cobro de factura`) && descripcion.includes(factura.numeroFactura);
      const esPagoDeEstaFactura = tipoOperacion === 'pago' && descripcion.includes(`Pago de factura`) && descripcion.includes(factura.numeroFactura);

      if (esCobroDeEstaFactura || esPagoDeEstaFactura) {
        // Sumamos el monto abonado (buscamos en las líneas del asiento la cuenta de Tesorería)
        const lineasIds = store.getRowIds('lineas').filter((lid: string) => store.getCell('lineas', lid, 'asientoId') === asientoId);
        lineasIds.forEach((lid: string) => {
          const cuentaId = store.getCell('lineas', lid, 'cuentaId');
          const codigoCuenta = store.getCell('cuentas', cuentaId, 'codigo');
          // Si la cuenta es Banco (1102) o Caja (1101), sumamos el debe (en cobros) o el haber (en pagos)
          if (codigoCuenta === '1102' || codigoCuenta === '1101') {
            totalAbonado += tipoOperacion === 'cobro' ? Number(store.getCell('lineas', lid, 'debe')) : Number(store.getCell('lineas', lid, 'haber'));
          }
        });
      }
    });

    return totalFactura - totalAbonado;
  };

  // Filtramos las facturas que aún tienen saldo pendiente (mayor a 0)
  const facturasPendientes = tipoOperacion === 'cobro' 
    ? ventasIds.filter((id: string) => calcularSaldoPendiente(id, 'ventas') > 0)
    : comprasIds.filter((id: string) => calcularSaldoPendiente(id, 'compras') > 0);

  const procesarTransaccion = () => {
    if (!documentoId || monto <= 0) return alert("Seleccione un documento y un monto válido.");

    const tabla = tipoOperacion === 'cobro' ? 'ventas' : 'compras';
    const factura = store.getRow(tabla, documentoId);
    const saldoPendiente = calcularSaldoPendiente(documentoId, tabla);

    if (monto > saldoPendiente) {
      return alert(`El monto a abonar no puede ser mayor al saldo pendiente (${saldoPendiente.toFixed(2)}).`);
    }

    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };

    const cBanco = buscarOCrearCuenta('1102', 'Banco', 'Activo');
    const cCaja = buscarOCrearCuenta('1101', 'Caja', 'Activo');
    const cuentaTesoreria = metodoPago === 'Banco' ? cBanco : cCaja;

    const asientoId = store.addRow('asientos', { 
      fecha: new Date().toISOString().split('T')[0], 
      descripcion: `${tipoOperacion === 'cobro' ? 'Cobro' : 'Pago'} de factura #${factura.numeroFactura}` // <-- Aquí guardamos el número de factura para el cálculo futuro
    });

    if (tipoOperacion === 'cobro') {
      const cClientes = buscarOCrearCuenta('1201', 'Clientes', 'Activo');
      store.addRow('lineas', { asientoId, cuentaId: cuentaTesoreria, debe: monto, haber: 0 });
      store.addRow('lineas', { asientoId, cuentaId: cClientes, debe: 0, haber: monto });
    } else {
      const cProveedores = buscarOCrearCuenta('2101', 'Proveedores', 'Pasivo');
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
      <p style={{ color: '#888', marginBottom: '20px' }}>Registra abonos. Las facturas con saldo 0 desaparecerán de la lista.</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setTipoOperacion('cobro'); setDocumentoId(''); setMonto(0); }} 
          style={{ padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: tipoOperacion === 'cobro' ? '#10b981' : '#333', color: 'white' }}
        >
          💰 Registrar Cobro (Clientes)
        </button>
        <button 
          onClick={() => { setTipoOperacion('pago'); setDocumentoId(''); setMonto(0); }} 
          style={{ padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: tipoOperacion === 'pago' ? '#f43f5e' : '#333', color: 'white' }}
        >
          💸 Registrar Pago (Proveedores)
        </button>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Seleccione la Factura con Saldo Pendiente</label>
          <select value={documentoId} onChange={(e) => { setDocumentoId(e.target.value); setMonto(0); }} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
            <option value="">Selecciona una factura...</option>
            {facturasPendientes.map((id: string) => {
              const tabla = tipoOperacion === 'cobro' ? 'ventas' : 'compras';
              const factura = store.getRow(tabla, id);
              const saldo = calcularSaldoPendiente(id, tabla);
              const condicion = factura.condicion === 'credito' ? ` | Vence: ${factura.vencimiento}` : ' | Contado';
              
              return (
                <option key={id} value={id}>
                  Factura #{factura.numeroFactura} - Saldo: ${saldo.toFixed(2)}{condicion}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Monto del Abono</label>
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