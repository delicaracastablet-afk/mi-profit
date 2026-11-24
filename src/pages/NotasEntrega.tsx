import { useState } from 'react';
import { useCell, useRowIds, useDelRowCallback } from 'tinybase/ui-react';
import { generarNotaEntregaPDF } from '../utils/generarPdf';

export const NotasEntrega = ({ store, tasaGlobal }: { store: any, tasaGlobal: number }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [rifCliente, setRifCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [carrito, setCarrito] = useState<{ productoId: string, nombre: string, precio: number, cantidad: number }[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

  const notasIds = useRowIds('notas_entrega', store);
  const clientesIds = useRowIds('clientes', store);
  const productosIds = useRowIds('productos', store);

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const cliente = store.getRow('clientes', selectedId);
      setRifCliente(String(cliente.rif || ''));
      setNombreCliente(String(cliente.nombre || ''));
    } else {
      setRifCliente(''); setNombreCliente('');
    }
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) return;
    const prod = store.getRow('productos', productoSeleccionado);
    if (Number(prod.stock) < cantidadSeleccionada) return alert(`Solo hay ${prod.stock} unidades en stock.`);

    const existe = carrito.find(item => item.productoId === productoSeleccionado);
    if (existe) {
      setCarrito(carrito.map(item => item.productoId === productoSeleccionado ? { ...item, cantidad: item.cantidad + cantidadSeleccionada } : item));
    } else {
      setCarrito([...carrito, { productoId: productoSeleccionado, nombre: String(prod.nombre), precio: Number(prod.precio), cantidad: cantidadSeleccionada }]);
    }
    setProductoSeleccionado(''); setCantidadSeleccionada(1);
  };

  const eliminarDelCarrito = (index: number) => setCarrito(carrito.filter((_, i) => i !== index));

  const generarNotaEntrega = () => {
    if (!rifCliente || carrito.length === 0) return alert("Seleccione un cliente y añada productos.");

    const totalUSD = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const numeroNota = `NE-${Date.now().toString().slice(-6)}`;

    store.addRow('notas_entrega', { fecha, rifCliente, nombreCliente, contenido: JSON.stringify(carrito), observaciones });

    carrito.forEach(item => {
      const stockActual = Number(store.getCell('productos', item.productoId, 'stock'));
      store.setCell('productos', item.productoId, 'stock', stockActual - item.cantidad);
    });

    const textoProductos = carrito.map(item => `${item.cantidad}x ${item.nombre}`).join(', ');
    generarNotaEntregaPDF(numeroNota, rifCliente, nombreCliente, fecha, textoProductos, totalUSD, tasaGlobal);

    alert("Nota de Entrega generada. El stock ha sido descontado y el PDF se ha descargado.");
    setRifCliente(''); setNombreCliente(''); setCarrito([]); setObservaciones('');
  };

  const borrarNota = useDelRowCallback('notas_entrega', store);

  const NotaRow = ({ id }: { id: string }) => {
    const f = useCell('notas_entrega', id, 'fecha', store);
    const n = useCell('notas_entrega', id, 'nombreCliente', store);
    const r = useCell('notas_entrega', id, 'rifCliente', store);

    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{String(f)}</td>
        <td style={{ padding: '10px' }}>{String(n)}</td>
        <td style={{ padding: '10px' }}>{String(r)}</td>
        <td style={{ padding: '10px' }}>
          <button onClick={() => borrarNota(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Anular</button>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <h2>Notas de Entrega</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Salida de mercancía sin facturación ni asientos contables.</p>

      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Cliente</label>
            <select onChange={handleClienteChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Seleccionar cliente...</option>
              {clientesIds.map((id: string) => {
                const c = store.getRow('clientes', id);
                return <option key={id} value={id}>{c.nombre} ({c.rif})</option>
              })}
            </select>
          </div>
        </div>

        {rifCliente && (
          <div style={{ backgroundColor: '#1f1f1f', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0ea5e9' }}>Productos a Entregar</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
                <option value="">Selecciona producto...</option>
                {productosIds.map((id: string) => {
                  const p = store.getRow('productos', id);
                  return <option key={id} value={id}>{p.codigo} - {p.nombre} (Stock: {p.stock}) - ${Number(p.precio).toFixed(2)}</option>
                })}
              </select>
              <input type="number" min="1" value={cantidadSeleccionada} onChange={(e) => setCantidadSeleccionada(Number(e.target.value))} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
              <button onClick={agregarAlCarrito} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>+ Añadir</button>
            </div>

            {carrito.length > 0 && (
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '5px' }}>Producto</th>
                    <th style={{ textAlign: 'center', padding: '5px' }}>Cant.</th>
                    <th style={{ textAlign: 'right', padding: '5px' }}>Precio (USD)</th>
                    <th style={{ textAlign: 'right', padding: '5px' }}>Total (USD)</th>
                    <th style={{ textAlign: 'center', padding: '5px' }}>X</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '5px' }}>{item.nombre}</td>
                      <td style={{ textAlign: 'center', padding: '5px' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right', padding: '5px' }}>${item.precio.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '5px' }}>${(item.precio * item.cantidad).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}><button onClick={() => eliminarDelCarrito(idx)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Observaciones</label>
          <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        </div>

        <button onClick={generarNotaEntrega} disabled={!rifCliente || carrito.length === 0} style={{ backgroundColor: (!rifCliente || carrito.length === 0) ? '#555' : '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>
          Generar Nota de Entrega (Descontar Stock)
        </button>
      </div>

      <h3>Historial de Notas de Entrega</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', fontSize: '14px' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>RIF</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {notasIds.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay notas de entrega.</td></tr>
          ) : (
            notasIds.map((id: string) => <NotaRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </div>
  );
};