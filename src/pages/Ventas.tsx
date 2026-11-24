import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';
import { generarFacturaPDF } from '../utils/generarPdf';

export const Ventas = ({ store, irAlibroFiscal, tasaGlobal }: { store: any, irAlibroFiscal: () => void, tasaGlobal: number }) => {
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
  const [rifCliente, setRifCliente] = useState('');
  const [numFacturaVenta, setNumFacturaVenta] = useState('');
  const [condicionPago, setCondicionPago] = useState<'contado' | 'credito'>('contado');
  const [diasCredito, setDiasCredito] = useState(30);
  
  const [lineasFactura, setLineasFactura] = useState<{ productoId: string, nombre: string, precio: number, costo: number, cantidad: number, stockDisponible: number }[]>([]);
  const [productoManual, setProductoManual] = useState('');
  const [cantidadManual, setCantidadManual] = useState(1);

  const productosIds = useRowIds('productos', store);
  const clientesIds = useRowIds('clientes', store);
  const pedidosIds = useRowIds('pedidos', store);

  const montoVentaUSD = lineasFactura.reduce((acc, l) => acc + (l.precio * l.cantidad), 0);
  const ivaCalculadoUSD = montoVentaUSD * 0.16;
  const totalFacturaUSD = montoVentaUSD + ivaCalculadoUSD;
  
  const montoVentaVES = montoVentaUSD * tasaGlobal;
  const ivaCalculadoVES = ivaCalculadoUSD * tasaGlobal;
  const totalFacturaVES = totalFacturaUSD * tasaGlobal;
  
  const costoTotalVenta = lineasFactura.reduce((acc, l) => acc + (l.costo * l.cantidad), 0);

  const fechaVencimiento = () => {
    const fecha = new Date(fechaVenta);
    fecha.setDate(fecha.getDate() + diasCredito);
    return fecha.toISOString().split('T')[0];
  };

  const cargarPedido = (pedidoId: string) => {
    if (!pedidoId) return;
    const pedido = store.getRow('pedidos', pedidoId);
    setRifCliente(pedido.rifCliente || '');
    
    try {
      const contenidoPedido = JSON.parse(pedido.contenido || '[]');
      const nuevasLineas: any[] = [];
      contenidoPedido.forEach((item: any) => {
        const stock = Number(store.getCell('productos', item.productoId, 'stock'));
        const costo = Number(store.getCell('productos', item.productoId, 'costo'));
        if (stock > 0) {
          const cantidadAFacturar = Math.min(item.cantidad, stock);
          nuevasLineas.push({
            productoId: item.productoId, nombre: item.nombre, precio: item.precio, costo: costo, cantidad: cantidadAFacturar, stockDisponible: stock
          });
          if (cantidadAFacturar < item.cantidad) alert(`Stock insuficiente de "${item.nombre}". Ajustado a ${cantidadAFacturar}.`);
        } else {
          alert(`"${item.nombre}" no tiene stock y no se incluirá.`);
        }
      });
      setLineasFactura(nuevasLineas);
    } catch (e) { alert("Error al leer el pedido."); }
  };

  const agregarProductoManual = () => {
    if (!productoManual || cantidadManual <= 0) return;
    const prod = store.getRow('productos', productoManual);
    const stock = Number(prod.stock);
    if (stock <= 0) return alert("No hay stock de este producto.");
    const cantidadReal = Math.min(cantidadManual, stock);
    
    const existe = lineasFactura.find(l => l.productoId === productoManual);
    if (existe) {
      setLineasFactura(lineasFactura.map(l => l.productoId === productoManual ? { ...l, cantidad: Math.min(l.cantidad + cantidadReal, stock) } : l));
    } else {
      setLineasFactura([...lineasFactura, {
        productoId: productoManual, nombre: prod.nombre, precio: Number(prod.precio), costo: Number(prod.costo), cantidad: cantidadReal, stockDisponible: stock
      }]);
    }
    setProductoManual(''); setCantidadManual(1);
  };

  const eliminarLinea = (index: number) => setLineasFactura(lineasFactura.filter((_, i) => i !== index));

  const registrarVenta = () => {
    if (montoVentaUSD <= 0 || !numFacturaVenta || lineasFactura.length === 0 || !rifCliente) return alert("Complete los datos y añada productos.");

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
    const cBanco = buscarOCrearCuenta('1102', 'Banco', 'Activo');

    store.addRow('ventas', { 
      fecha: fechaVenta, rif: rifCliente, numeroFactura: numFacturaVenta, baseImponible: montoVentaVES, iva: ivaCalculadoVES, total: totalFacturaVES,
      condicion: condicionPago, vencimiento: condicionPago === 'credito' ? fechaVencimiento() : fechaVenta,
      contenido: JSON.stringify(lineasFactura),
      tasaBCV: tasaGlobal
    });
    
    const asientoId = store.addRow('asientos', { fecha: fechaVenta, descripcion: `Factura Venta #${numFacturaVenta} (${condicionPago.toUpperCase()})` });
    if (condicionPago === 'contado') {
      store.addRow('lineas', { asientoId, cuentaId: cBanco, debe: totalFacturaVES, haber: 0 });
    } else {
      store.addRow('lineas', { asientoId, cuentaId: cClientes, debe: totalFacturaVES, haber: 0 });
    }
    store.addRow('lineas', { asientoId, cuentaId: cIngresos, debe: 0, haber: montoVentaVES });
    store.addRow('lineas', { asientoId, cuentaId: cIVA, debe: 0, haber: ivaCalculadoVES });

    if (costoTotalVenta > 0) {
      const asientoCostoId = store.addRow('asientos', { fecha: fechaVenta, descripcion: `Costo de Venta - Factura #${numFacturaVenta}` });
      store.addRow('lineas', { asientoId: asientoCostoId, cuentaId: cCostoVenta, debe: costoTotalVenta, haber: 0 });
      store.addRow('lineas', { asientoId: asientoCostoId, cuentaId: cInventario, debe: 0, haber: costoTotalVenta });
    }

    lineasFactura.forEach(linea => {
      const stockActual = Number(store.getCell('productos', linea.productoId, 'stock'));
      store.setCell('productos', linea.productoId, 'stock', stockActual - linea.cantidad);
    });

    generarFacturaPDF(numFacturaVenta, rifCliente, fechaVenta, lineasFactura, 1, montoVentaUSD, montoVentaUSD, ivaCalculadoUSD, totalFacturaUSD, condicionPago, condicionPago === 'credito' ? fechaVencimiento() : '', tasaGlobal, totalFacturaVES);

    setLineasFactura([]); setNumFacturaVenta(''); setRifCliente('');
    alert("Factura registrada exitosamente.");
    irAlibroFiscal();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Registro de Ventas</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario (Columna Izquierda) */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6 border border-gray-700 border-l-4 border-l-blue-500">
            <label className="block mb-2 text-sm text-blue-400 font-bold">Cargar desde Pedido (Opcional)</label>
            <select onChange={(e) => cargarPedido(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">-- Seleccionar un pedido guardado --</option>
              {pedidosIds.map((id: string) => {
                const p = store.getRow('pedidos', id);
                return <option key={id} value={id}>Pedido de {p.nombreCliente} ({p.fecha})</option>
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400">Fecha</label>
              <input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">Nro. Factura</label>
              <input placeholder="Ej. 00001" value={numFacturaVenta} onChange={(e) => setNumFacturaVenta(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-sm text-gray-400">Cliente</label>
            <select value={rifCliente} onChange={(e) => setRifCliente(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Seleccione un cliente...</option>
              {clientesIds.map((id: string) => {
                const c = store.getRow('clientes', id);
                return <option key={id} value={c.rif}>{c.nombre} ({c.rif})</option>
              })}
            </select>
          </div>

          <div className="flex gap-2 items-end mb-6">
            <div className="flex-1">
              <label className="block mb-1 text-sm text-gray-400">Añadir Producto</label>
              <select value={productoManual} onChange={(e) => setProductoManual(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
                <option value="">Selecciona producto...</option>
                {productosIds.map((id: string) => (
                  <option key={id} value={id}>{store.getCell('productos', id, 'nombre')} (Stock: {store.getCell('productos', id, 'stock')})</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <input type="number" min="1" value={cantidadManual} onChange={(e) => setCantidadManual(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={agregarProductoManual} className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg transition-colors">
              + Añadir
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 bg-gray-900/50">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Precio (USD)</th>
                  <th className="p-3 text-right">Total (USD)</th>
                  <th className="p-3 text-center">X</th>
                </tr>
              </thead>
              <tbody>
                {lineasFactura.map((linea, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="p-3 text-white">{linea.nombre}</td>
                    <td className="p-3 text-center text-gray-300">{linea.cantidad}</td>
                    <td className="p-3 text-right text-gray-300">${linea.precio.toFixed(2)}</td>
                    <td className="p-3 text-right text-white font-medium">${(linea.precio * linea.cantidad).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => eliminarLinea(index)} className="text-red-400 hover:text-red-300 transition-colors">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen (Columna Derecha) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg sticky top-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base (USD):</span>
                <span className="text-white">${montoVentaUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">IVA (16%):</span>
                <span className="text-white">${ivaCalculadoUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-700 pt-3">
                <span className="text-gray-400 font-bold">TOTAL USD:</span>
                <span className="text-green-400 font-bold">${totalFacturaUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TOTAL VES:</span>
                <span className="text-yellow-400 font-bold">Bs. {totalFacturaVES.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm text-gray-400">Condición</label>
              <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value as 'contado' | 'credito')} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500">
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            {condicionPago === 'credito' && (
              <div className="mb-6">
                <label className="block mb-1 text-sm text-gray-400">Días Crédito</label>
                <input type="number" value={diasCredito} onChange={(e) => setDiasCredito(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
            )}

            <button 
              onClick={registrarVenta} 
              disabled={montoVentaUSD <= 0 || !numFacturaVenta || lineasFactura.length === 0 || !rifCliente} 
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Registrar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};