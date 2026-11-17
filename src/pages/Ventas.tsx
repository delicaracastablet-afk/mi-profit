import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';
import { generarFacturaPDF } from '../utils/generarPdf';

export const Ventas = ({ store, irAlibroFiscal }: { store: any, irAlibroFiscal: () => void }) => {
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
  const [rifCliente, setRifCliente] = useState('V-12345678');
  const [numFacturaVenta, setNumFacturaVenta] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const productosIds = useRowIds('productos', store);
  
  // Obtenemos los datos del producto seleccionado
  const prodSeleccionado = productoId ? store.getRow('productos', productoId) : null;
  const precioUnitario = prodSeleccionado ? Number(prodSeleccionado.precio) : 0;
  const costoUnitario = prodSeleccionado ? Number(prodSeleccionado.costo) : 0;
  const stockActual = prodSeleccionado ? Number(prodSeleccionado.stock) : 0;

  const montoVenta = precioUnitario * cantidad;
  const ivaCalculadoVenta = montoVenta * 0.16;
  const totalFacturaVenta = montoVenta + ivaCalculadoVenta;
  const costoTotalVenta = costoUnitario * cantidad;

  const registrarVenta = () => {
    if (montoVenta <= 0 || !numFacturaVenta || !productoId) return alert("Complete los datos.");
    if (cantidad > stockActual) return alert(`No hay suficiente stock. Solo quedan ${stockActual} unidades.`);

    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };
    const cClientes = buscarOCrearCuenta('1201', 'Clientes', 'Activo');
    const cIngresos = buscarOCrearCuenta('4101', 'Ingresos', 'Ingreso');
    const cIVA = buscarOCrearCuenta('2201', 'IVA por Pagar', 'Pasivo');
    const cCostoVenta = buscarOCrearCuenta('6101', 'Costo de Venta', 'Gasto');
    const cInventario = buscarOCrearCuenta('1301', 'Inventario', 'Activo');

    // 1. Guardar la venta fiscal
    store.addRow('ventas', { fecha: fechaVenta, rif: rifCliente, numeroFactura: numFacturaVenta, baseImponible: montoVenta, iva: ivaCalculadoVenta, total: totalFacturaVenta });
    
    // 2. Generar Asiento de Ingreso
    const asientoId = store.addRow('asientos', { fecha: fechaVenta, descripcion: `Factura Venta #${numFacturaVenta}` });
    store.addRow('lineas', { asientoId, cuentaId: cClientes, debe: totalFacturaVenta, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cIngresos, debe: 0, haber: montoVenta });
    store.addRow('lineas', { asientoId, cuentaId: cIVA, debe: 0, haber: ivaCalculadoVenta });

    // 3. Generar Asiento de Costo de Venta (Si el producto tiene costo)
    if (costoTotalVenta > 0) {
      const asientoCostoId = store.addRow('asientos', { fecha: fechaVenta, descripcion: `Costo de Venta - Factura #${numFacturaVenta}` });
      store.addRow('lineas', { asientoId: asientoCostoId, cuentaId: cCostoVenta, debe: costoTotalVenta, haber: 0 });
      store.addRow('lineas', { asientoId: asientoCostoId, cuentaId: cInventario, debe: 0, haber: costoTotalVenta });
    }

    // 4. Restar el stock
    store.setCell('productos', productoId, 'stock', stockActual - cantidad);

    // 5. Limpiar
    setCantidad(1); setNumFacturaVenta(''); setProductoId('');
    // Generar el PDF de la factura
generarFacturaPDF(
  numFacturaVenta, 
  rifCliente, 
  fechaVenta, 
  prodSeleccionado.nombre, 
  cantidad, 
  precioUnitario, 
  montoVenta, 
  ivaCalculadoVenta, 
  totalFacturaVenta
);
    alert("Venta registrada y stock actualizado.");
    irAlibroFiscal();
  };

  return (
    <div>
      <h2>Registro de Ventas</h2>
      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Fecha</label><input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} /></div>
          <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>RIF Cliente</label><input value={rifCliente} onChange={(e) => setRifCliente(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} /></div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nro. Factura</label>
          <input placeholder="Ej. 00001" value={numFacturaVenta} onChange={(e) => setNumFacturaVenta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Producto</label>
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Selecciona un producto...</option>
              {productosIds.map((id: string) => (
                <option key={id} value={id}>{store.getCell('productos', id, 'codigo')} - {store.getCell('productos', id, 'nombre')} (Stock: {store.getCell('productos', id, 'stock')})</option>
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Precio Unitario:</span> <span>{precioUnitario.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Imponible:</span> <span>{montoVenta.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA (16%):</span> <span>{ivaCalculadoVenta.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'white', marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}><span>TOTAL:</span> <span>{totalFacturaVenta.toFixed(2)}</span></div>
          </div>
        )}

        <button onClick={registrarVenta} disabled={montoVenta <= 0 || !numFacturaVenta || !productoId} style={{ backgroundColor: (montoVenta > 0 && numFacturaVenta) ? '#10b981' : '#555', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>Registrar Venta</button>
      </div>
    </div>
  );
};