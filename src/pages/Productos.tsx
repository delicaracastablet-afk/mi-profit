import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Productos = ({ store }: { store: any }) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);

  const productosIds = useRowIds('productos', store);

  const agregarProducto = useAddRowCallback('productos', () => ({ codigo, nombre, costo, precio, stock }), [codigo, nombre, costo, precio, stock], store, () => {
    setCodigo(''); setNombre(''); setCosto(0); setPrecio(0); setStock(0);
  });

  const borrarProducto = useDelRowCallback('productos', store);

  const ProductoRow = ({ id }: { id: string }) => {
    const c = useCell('productos', id, 'codigo', store);
    const n = useCell('productos', id, 'nombre', store);
    const co = useCell('productos', id, 'costo', store);
    const p = useCell('productos', id, 'precio', store);
    const s = useCell('productos', id, 'stock', store);
    
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{c}</td>
        <td style={{ padding: '10px' }}>{n}</td>
        <td style={{ padding: '10px' }}>{Number(co).toFixed(2)}</td>
        <td style={{ padding: '10px' }}>{Number(p).toFixed(2)}</td>
        <td style={{ padding: '10px', color: Number(s) <= 5 ? '#f43f5e' : 'white', fontWeight: 'bold' }}>{s} uds</td>
        <td style={{ padding: '10px' }}><button onClick={() => borrarProducto(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button></td>
      </tr>
    );
  };

  return (
    <>
      <h2>Catálogo de Productos</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <input placeholder="Nombre del Producto" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input type="number" placeholder="Costo ($)" value={costo || ''} onChange={(e) => setCosto(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <input type="number" placeholder="Precio Venta ($)" value={precio || ''} onChange={(e) => setPrecio(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '120px' }} />
        <input type="number" placeholder="Stock Inicial" value={stock || ''} onChange={(e) => setStock(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <button onClick={agregarProducto} disabled={!codigo || !nombre} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Añadir</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Código</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Producto</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Costo</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Precio Venta</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosIds.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay productos registrados</td></tr>
          ) : (
            productosIds.map((id) => <ProductoRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </>
  );
};