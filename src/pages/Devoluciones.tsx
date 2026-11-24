import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Devoluciones = ({ store, irAlLibro }: { store: any, irAlLibro: () => void }) => {
  const [ventaId, setVentaId] = useState('');
  const [motivo, setMotivo] = useState('Devolución de mercancía');
  const [productoId, setProductoId] = useState('');
  const [cantidadDevuelta, setCantidadDevuelta] = useState(1);
  const [itemsFactura, setItemsFactura] = useState<any[]>([]);

  const ventasIds = useRowIds('ventas', store);
  const todosLosProductosIds = useRowIds('productos', store); 
  const ventaSeleccionada = ventaId ? store.getRow('ventas', ventaId) : null;

  // --- CÁLCULOS DINÁMICOS DE LA DEVOLUCIÓN ---
  const itemSeleccionado = itemsFactura.find(item => item.productoId === productoId);
  
  // Si encontramos el producto en la factura, usamos su precio. Si no, usamos 0.
  const precioUnitario = itemSeleccionado ? Number(itemSeleccionado.precio) : 0;
  
  const montoBaseDevolucion = precioUnitario * cantidadDevuelta;
  const ivaDevolucion = montoBaseDevolucion * 0.16;
  const totalDevolucion = montoBaseDevolucion + ivaDevolucion;

  const seleccionarFactura = (id: string) => {
    setVentaId(id);
    setProductoId('');
    setCantidadDevuelta(1);
    
    if (id) {
      const factura = store.getRow('ventas', id);
      const contenido = factura.contenido; 
      
      if (contenido) {
        try {
          const items = JSON.parse(String(contenido));
          setItemsFactura(items);
        } catch (e) {
          setItemsFactura([]);
        }
      } else {
        setItemsFactura([]);
      }
    } else {
      setItemsFactura([]);
    }
  };

  const procesarDevolucion = () => {
    if (!ventaId || !ventaSeleccionada || !productoId || cantidadDevuelta <= 0) {
      return alert("Seleccione una factura, un producto y una cantidad válida.");
    }

    // Validar que no devuelva más de lo que compró
    const cantidadVendida = itemSeleccionado ? Number(itemSeleccionado.cantidad) : 0;
    if (cantidadDevuelta > cantidadVendida) {
      return alert(`No puedes devolver más de lo que se vendió. En esta factura solo se vendieron ${cantidadVendida} unidades.`);
    }

    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };

    const cDevoluciones = buscarOCrearCuenta('4102', 'Devoluciones en Ventas', 'Ingreso');
    const cIVA = buscarOCrearCuenta('2201', 'IVA por Pagar', 'Pasivo');
    const cClientes = buscarOCrearCuenta('1201', 'Clientes', 'Activo');

    // Asiento Contable SOLO por el monto parcial devuelto
    const asientoId = store.addRow('asientos', { 
      fecha: new Date().toISOString().split('T')[0], 
      descripcion: `Nota de Crédito - Factura #${ventaSeleccionada.numeroFactura} (${cantidadDevuelta} und. de ${itemSeleccionado?.nombre})` 
    });

    store.addRow('lineas', { asientoId, cuentaId: cDevoluciones, debe: montoBaseDevolucion, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cIVA, debe: ivaDevolucion, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cClientes, debe: 0, haber: totalDevolucion });

    // REINTEGRAR LA CANTIDAD DEVUELTA AL ALMACÉN
    const stockActual = Number(store.getCell('productos', productoId, 'stock'));
    store.setCell('productos', productoId, 'stock', stockActual + cantidadDevuelta);

    alert(`Devolución procesada: Se reintegraron ${cantidadDevuelta} unidades al almacén y se acreditaron $${totalDevolucion.toFixed(2)}.`);
    setVentaId(''); setProductoId(''); setCantidadDevuelta(1); setItemsFactura([]);
    irAlLibro();
  };

  let productosAMostrar: any[] = [];
  if (itemsFactura.length > 0) {
    productosAMostrar = itemsFactura;
  } else {
    productosAMostrar = todosLosProductosIds.map((id: string) => ({
      productoId: id,
      nombre: store.getCell('productos', id, 'nombre'),
      cantidad: null,
      precio: Number(store.getCell('productos', id, 'precio'))
    }));
  }

  return (
    <div>
      <h2>Devoluciones (Notas de Crédito)</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Revierte el monto proporcional de los productos devueltos.</p>

      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>1. Factura a Devolver</label>
          <select value={ventaId} onChange={(e) => seleccionarFactura(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
            <option value="">Selecciona una factura...</option>
            {ventasIds.map((id: string) => {
              const v = store.getRow('ventas', id);
              return <option key={id} value={id}>Factura #{v.numeroFactura} - Total: {Number(v.total).toFixed(2)}</option>
            })}
          </select>
        </div>

        {ventaSeleccionada && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>2. Producto que regresa al Almacén</label>
              <select value={productoId} onChange={(e) => { setProductoId(e.target.value); setCantidadDevuelta(1); }} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
                <option value="">Selecciona el producto...</option>
                {productosAMostrar.map((prod: any) => (
                  <option key={prod.productoId} value={prod.productoId}>
                    {prod.nombre} {prod.cantidad ? `(Vendidos: ${prod.cantidad})` : ''} - ${Number(prod.precio).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>3. Cantidad a Devolver</label>
                <input 
                  type="number" 
                  min="1" 
                  max={itemSeleccionado?.cantidad} // Bloquea el input para que no pida más de lo vendido
                  value={cantidadDevuelta} 
                  onChange={(e) => setCantidadDevuelta(Number(e.target.value))} 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} 
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Motivo</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
              </div>
            </div>

            {itemSeleccionado && (
              <div style={{ marginBottom: '20px', fontSize: '14px', color: '#aaa', backgroundColor: '#1f1f1f', padding: '15px', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>Resumen de la Devolución Parcial:</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Precio Unitario:</span> <span>${precioUnitario.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cantidad a devolver:</span> <span>{cantidadDevuelta}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}><span>Base Imponible:</span> <span>${montoBaseDevolucion.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA (16%):</span> <span>${ivaDevolucion.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#f43f5e', marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}><span>TOTAL A ACREDITAR:</span> <span>${totalDevolucion.toFixed(2)}</span></div>
              </div>
            )}

            <button onClick={procesarDevolucion} disabled={!productoId} style={{ backgroundColor: productoId ? '#f43f5e' : '#555', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>
              Procesar Nota de Crédito Parcial
            </button>
          </>
        )}
      </div>
    </div>
  );
};