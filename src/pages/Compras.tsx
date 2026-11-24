import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Compras = ({ store, irAlibroCompras }: { store: any, irAlibroCompras: () => void }) => {
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [rifProveedor, setRifProveedor] = useState('');
  const [numFacturaCompra, setNumFacturaCompra] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [condicionPago, setCondicionPago] = useState<'contado' | 'credito'>('contado');
  const [diasCredito, setDiasCredito] = useState(30);

  const proveedoresIds = useRowIds('proveedores', store);
  const productosIds = useRowIds('productos', store);

  const prodSeleccionado = productoId ? store.getRow('productos', productoId) : null;
  const costoUnitario = prodSeleccionado ? Number(prodSeleccionado.costo) : 0;

  const montoCompra = costoUnitario * cantidad;
  const ivaCalculadoCompra = montoCompra * 0.16;
  const totalFacturaCompra = montoCompra + ivaCalculadoCompra;

  const fechaVencimiento = () => {
    const fecha = new Date(fechaCompra);
    fecha.setDate(fecha.getDate() + diasCredito);
    return fecha.toISOString().split('T')[0];
  };

  const registrarCompra = () => {
    if (montoCompra <= 0 || !numFacturaCompra || !productoId || !rifProveedor) {
      return alert("Complete todos los datos, incluyendo el proveedor.");
    }
    
    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };
    
    const cInventario = buscarOCrearCuenta('1301', 'Inventario', 'Activo');
    const cIVACredito = buscarOCrearCuenta('1202', 'IVA Crédito', 'Activo');
    const cProveedores = buscarOCrearCuenta('2101', 'Proveedores', 'Pasivo');
    const cBanco = buscarOCrearCuenta('1102', 'Banco', 'Activo');

    store.addRow('compras', { 
      fecha: fechaCompra, rif: rifProveedor, numeroFactura: numFacturaCompra, baseImponible: montoCompra, iva: ivaCalculadoCompra, total: totalFacturaCompra,
      condicion: condicionPago, vencimiento: condicionPago === 'credito' ? fechaVencimiento() : fechaCompra,
      tasaBCV: tasaGlobal
    });
    
    const asientoId = store.addRow('asientos', { fecha: fechaCompra, descripcion: `Factura Compra #${numFacturaCompra} (${condicionPago.toUpperCase()})` });
    
    store.addRow('lineas', { asientoId, cuentaId: cInventario, debe: montoCompra, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cIVACredito, debe: ivaCalculadoCompra, haber: 0 });

    if (condicionPago === 'contado') {
      store.addRow('lineas', { asientoId, cuentaId: cBanco, debe: 0, haber: totalFacturaCompra });
    } else {
      store.addRow('lineas', { asientoId, cuentaId: cProveedores, debe: 0, haber: totalFacturaCompra });
    }

    store.setCell('productos', productoId, 'stock', Number(prodSeleccionado.stock) + cantidad);

    setCantidad(1); setNumFacturaCompra(''); setProductoId(''); setRifProveedor(''); setCondicionPago('contado');
    alert("Compra registrada exitosamente.");
    irAlibroCompras();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Registro de Compras</h2>
      
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm text-gray-400">Fecha</label>
            <input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">Proveedor</label>
            <select value={rifProveedor} onChange={(e) => setRifProveedor(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Seleccione un proveedor...</option>
              {proveedoresIds.map((id: string) => {
                const prov = store.getRow('proveedores', id);
                return <option key={id} value={prov.rif}>{prov.nombre} ({prov.rif})</option>
              })}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-400">Nro. Factura</label>
          <input placeholder="Ej. 00001" value={numFacturaCompra} onChange={(e) => setNumFacturaCompra(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
        </div>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-400">Producto a Comprar</label>
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Selecciona un producto...</option>
              {productosIds.map((id: string) => (
                <option key={id} value={id}>{store.getCell('productos', id, 'codigo')} - {store.getCell('productos', id, 'nombre')}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block mb-1 text-sm text-gray-400">Cantidad</label>
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="flex gap-4 mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-blue-400 font-bold">Condición de Pago</label>
            <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value as 'contado' | 'credito')} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          {condicionPago === 'credito' && (
            <div className="flex-1">
              <label className="block mb-1 text-sm text-blue-400 font-bold">Días de Crédito</label>
              <input type="number" min="1" value={diasCredito} onChange={(e) => setDiasCredito(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          )}
        </div>

        {prodSeleccionado && (
          <div className="mb-6 p-4 rounded-lg bg-gray-900 border border-gray-700 text-sm">
            <div className="flex justify-between mb-2"><span className="text-gray-400">Costo Unitario:</span> <span className="text-white">${costoUnitario.toFixed(2)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-400">Base Imponible:</span> <span className="text-white">${montoCompra.toFixed(2)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-400">IVA (16%):</span> <span className="text-white">${ivaCalculadoCompra.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t border-gray-700 pt-2 mt-2"><span className="text-gray-300">TOTAL:</span> <span className="text-green-400">${totalFacturaCompra.toFixed(2)}</span></div>
            {condicionPago === 'credito' && <div className="mt-2 text-red-400 font-bold text-right text-xs">Vence el: {fechaVencimiento()}</div>}
          </div>
        )}

        <button 
          onClick={registrarCompra} 
          disabled={montoCompra <= 0 || !numFacturaCompra || !productoId || !rifProveedor} 
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Registrar Compra
        </button>
      </div>
    </div>
  );
};