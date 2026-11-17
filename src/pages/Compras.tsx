import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Compras = ({ store, irAlibroCompras }: { store: any, irAlibroCompras: () => void }) => {
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [rifProveedor, setRifProveedor] = useState('J-12345678');
  const [numFacturaCompra, setNumFacturaCompra] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const productosIds = useRowIds('productos', store);

  const prodSeleccionado = productoId ? store.getRow('productos', productoId) : null;
  const costoUnitario = prodSeleccionado ? Number(prodSeleccionado.costo) : 0;
  const stockActual = prodSeleccionado ? Number(prodSeleccionado.stock) : 0;

  const montoCompra = costoUnitario * cantidad;
  const ivaCalculadoCompra = montoCompra * 0.16;
  const totalFacturaCompra = montoCompra + ivaCalculadoCompra;

  const registrarCompra = () => {
    if (montoCompra <= 0 || !numFacturaCompra || !productoId) return alert("Complete los datos.");
    
    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };
    const cInventario = buscarOCrearCuenta('1301', 'Inventario', 'Activo');
    const cIVACredito = buscarOCrearCuenta('1202', 'IVA Crédito', 'Activo');
    const cProveedores = buscarOCrearCuenta('2101', 'Proveedores', 'Pasivo');

    store.addRow('compras', { fecha: fechaCompra, rif: rifProveedor, numeroFactura: numFacturaCompra, baseImponible: montoCompra, iva: ivaCalculadoCompra, total: totalFacturaCompra });
    
    const asientoId = store.addRow('asientos', { fecha: fechaCompra, descripcion: `Factura Compra #${numFacturaCompra}` });
    store.addRow('lineas', { asientoId, cuentaId: cInventario, debe: montoCompra, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cIVACredito, debe: ivaCalculadoCompra, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cProveedores, debe: 0, haber: totalFacturaCompra });

    // Aumentar el stock
    store.setCell('productos', productoId, 'stock', stockActual + cantidad);

    setCantidad(1); setNumFacturaCompra(''); setProductoId('');
    alert("Compra registrada y stock actualizado.");
    irAlibroCompras();
  };

  return (
    <div>
      <h2>Registro de Compras</h2>
      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Fecha</label><input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} /></div>
          <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>RIF Proveedor</label><input value={rifProveedor} onChange={(e) => setRifProveedor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} /></div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nro. Factura</label>
          <input placeholder="Ej. 00001" value={numFacturaCompra} onChange={(e) => setNumFacturaCompra(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Producto a Comprar</label>
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Selecciona un producto...</option>
              {productosIds.map((id: string) => (
                <option key={id} value={id}>{store.getCell('productos', id, 'codigo')} - {store.getCell('productos', id, 'nombre')}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Cantidad</label>
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        {prodSeleccionado && (
          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#aaa', backgroundColor: '#1f1f1f', padding: '15px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Costo Unitario:</span> <span>{costoUnitario.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Imponible:</span> <span>{montoCompra.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA (16%):</span> <span>{ivaCalculadoCompra.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'white', marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}><span>TOTAL:</span> <span>{totalFacturaCompra.toFixed(2)}</span></div>
          </div>
        )}

        <button onClick={registrarCompra} disabled={montoCompra <= 0 || !numFacturaCompra || !productoId} style={{ backgroundColor: (montoCompra > 0 && numFacturaCompra) ? '#10b981' : '#555', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>Registrar Compra</button>
      </div>
    </div>
  );
};