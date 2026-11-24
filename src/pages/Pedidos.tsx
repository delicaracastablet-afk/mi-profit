import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Pedidos = ({ store }: { store: any }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [vendedor, setVendedor] = useState('');
  const [rifCliente, setRifCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [codigoSunagro, setCodigoSunagro] = useState('');
  const [horarioRecepcion, setHorarioRecepcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [monedaPago, setMonedaPago] = useState('VES');
  const [condicionPago, setCondicionPago] = useState('Contado');

  // --- ESTADO DEL CARRITO ---
  const [carrito, setCarrito] = useState<{ productoId: string, nombre: string, precio: number, cantidad: number }[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

  const pedidosIds = useRowIds('pedidos', store);
  const clientesIds = useRowIds('clientes', store);
  const productosIds = useRowIds('productos', store);

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const cliente = store.getRow('clientes', selectedId);
      setRifCliente(cliente.rif || '');
      setNombreCliente(cliente.nombre || '');
      setTelefonoCliente(cliente.telefono || '');
    } else {
      setRifCliente('');
      setNombreCliente('');
      setTelefonoCliente('');
    }
  };

  // --- FUNCIONES DEL CARRITO CON VALIDACIÓN DE STOCK ---
  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) return;
    
    const prod = store.getRow('productos', productoSeleccionado);
    const stockDisponible = Number(prod.stock);

    if (stockDisponible <= 0) {
      alert("No hay stock disponible de este producto.");
      return;
    }

    const existe = carrito.find(item => item.productoId === productoSeleccionado);
    const cantidadActualEnCarrito = existe ? existe.cantidad : 0;
    
    if (cantidadActualEnCarrito + cantidadSeleccionada > stockDisponible) {
      alert(`Solo hay ${stockDisponible} unidades disponibles en el almacén.`);
      return;
    }

    if (existe) {
      setCarrito(carrito.map(item => 
        item.productoId === productoSeleccionado 
          ? { ...item, cantidad: item.cantidad + cantidadSeleccionada } 
          : item
      ));
    } else {
      setCarrito([...carrito, {
        productoId: productoSeleccionado,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        cantidad: cantidadSeleccionada
      }]);
    }
    
    setProductoSeleccionado('');
    setCantidadSeleccionada(1);
  };

  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const totalPedido = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const agregarPedido = useAddRowCallback(
    'pedidos',
    () => ({ 
      fecha, vendedor, rifCliente, nombreCliente, telefonoCliente, codigoSunagro, 
      horarioRecepcion, contenido: JSON.stringify(carrito), observaciones, monedaPago, condicionPago 
    }),
    [fecha, vendedor, rifCliente, nombreCliente, telefonoCliente, codigoSunagro, horarioRecepcion, carrito, observaciones, monedaPago, condicionPago],
    store,
    () => {
      setVendedor(''); setRifCliente(''); setNombreCliente(''); setTelefonoCliente('');
      setCodigoSunagro(''); setHorarioRecepcion(''); setCarrito([]); setObservaciones('');
      setMonedaPago('VES'); setCondicionPago('Contado');
    }
  );

  const borrarPedido = useDelRowCallback('pedidos', store);

  const PedidoRow = ({ id }: { id: string }) => {
    const f = useCell('pedidos', id, 'fecha', store);
    const n = useCell('pedidos', id, 'nombreCliente', store);
    const v = useCell('pedidos', id, 'vendedor', store);
    const m = useCell('pedidos', id, 'monedaPago', store);
    
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{String(f)}</td>
        <td style={{ padding: '10px' }}>{String(v)}</td>
        <td style={{ padding: '10px' }}>{String(n)}</td>
        <td style={{ padding: '10px' }}>{String(m)}</td>
        <td style={{ padding: '10px' }}>
          {/* BOTÓN DE ANULAR CORREGIDO (sin confirm) */}
          <button 
            onClick={() => borrarPedido(id)} 
            style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Anular Pedido
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>📱 Toma de Pedidos (Vendedores)</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Registra pedidos desde la calle. Compatible con teléfonos móviles.</p>

      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        
        {/* DATOS GENERALES */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nombre del Vendedor</label>
            <input value={vendedor} onChange={(e) => setVendedor(e.target.value)} placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Seleccionar Cliente (Opcional)</label>
          <select onChange={handleClienteChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', marginBottom: '10px' }}>
            <option value="">-- Seleccionar cliente registrado --</option>
            {clientesIds.map((id: string) => {
              const c = store.getRow('clientes', id);
              return <option key={id} value={id}>{c.nombre} ({c.rif})</option>
            })}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>RIF del Cliente</label>
            <input value={rifCliente} onChange={(e) => setRifCliente(e.target.value)} placeholder="J-12345678-9" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nombre del Cliente</label>
            <input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Nombre o Razón Social" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Teléfono</label>
            <input value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} placeholder="0414-1234567" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Código SUNAGRO</label>
            <input value={codigoSunagro} onChange={(e) => setCodigoSunagro(e.target.value)} placeholder="A-123456" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Horario de Recepción</label>
            <input value={horarioRecepcion} onChange={(e) => setHorarioRecepcion(e.target.value)} placeholder="Ej. 8:00 AM - 12:00 PM" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        {/* CARRITO DE PRODUCTOS */}
        <div style={{ backgroundColor: '#1f1f1f', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0ea5e9' }}>🛒 Productos del Pedido</h4>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
                <option value="">Selecciona un producto...</option>
                {productosIds.map((id: string) => {
                  const p = store.getRow('productos', id);
                  return <option key={id} value={id}>{p.codigo} - {p.nombre} (Stock: {p.stock})</option>
                })}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '80px' }}>
              <input type="number" min="1" value={cantidadSeleccionada} onChange={(e) => setCantidadSeleccionada(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
            </div>
            <button onClick={agregarAlCarrito} disabled={!productoSeleccionado} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: productoSeleccionado ? 'pointer' : 'not-allowed' }}>
              + Añadir
            </button>
          </div>

          {/* Tabla del Carrito */}
          {carrito.length > 0 ? (
            <table style={{ width: '100%', fontSize: '14px', marginBottom: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th style={{ textAlign: 'left', padding: '5px' }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '5px' }}>Cant.</th>
                  <th style={{ textAlign: 'right', padding: '5px' }}>Precio</th>
                  <th style={{ textAlign: 'right', padding: '5px' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '5px' }}>X</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '5px' }}>{item.nombre}</td>
                    <td style={{ textAlign: 'center', padding: '5px' }}>{item.cantidad}</td>
                    <td style={{ textAlign: 'right', padding: '5px' }}>${item.precio.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '5px' }}>${(item.precio * item.cantidad).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '5px' }}>
                      <button onClick={() => eliminarDelCarrito(index)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '16px' }}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>No hay productos en el pedido aún.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #444', paddingTop: '10px', marginTop: '10px' }}>
            <span>TOTAL ESTIMADO:</span>
            <span style={{ color: '#10b981' }}>${totalPedido.toFixed(2)}</span>
          </div>
        </div>

        {/* OBSERVACIONES Y PAGO */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Observaciones</label>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej. Entregar por la puerta trasera..." rows={2} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Moneda de Pago</label>
            <select value={monedaPago} onChange={(e) => setMonedaPago(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="VES">Bolívares (VES)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="COP">Pesos (COP)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Condición de Pago</label>
            <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="Contado">Contado</option>
              <option value="Crédito 7 días">Crédito 7 días</option>
              <option value="Crédito 15 días">Crédito 15 días</option>
              <option value="Crédito 30 días">Crédito 30 días</option>
            </select>
          </div>
        </div>

        <button onClick={agregarPedido} disabled={!vendedor || !nombreCliente || carrito.length === 0} style={{ backgroundColor: (!vendedor || !nombreCliente || carrito.length === 0) ? '#555' : '#0ea5e9', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%', fontSize: '16px' }}>
          Guardar Pedido
        </button>
      </div>

      {/* Tabla de Pedidos Registrados */}
      <h3>Pedidos Registrados</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', fontSize: '14px' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Vendedor</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Moneda</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidosIds.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay pedidos registrados.</td></tr>
          ) : (
            pedidosIds.map((id: string) => <PedidoRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </div>
  );
};