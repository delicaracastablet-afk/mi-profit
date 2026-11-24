import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Inventario = ({ store }: { store: any }) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);
  const [almacenId, setAlmacenId] = useState('');
  
  // NUEVO ESTADO: Para saber si estamos editando (guardamos el ID)
  const [idEditando, setIdEditando] = useState<string | null>(null);

  const productosIds = useRowIds('productos', store);
  const almacenesIds = useRowIds('almacenes', store);

  const guardarProducto = () => {
    if (idEditando) {
      // SI ESTAMOS EDITANDO: Actualizamos la fila existente
      store.setRow('productos', idEditando, { codigo, nombre, costo, precio, stock, almacenId });
      setIdEditando(null);
    } else {
      // SI ES NUEVO: Agregamos una fila nueva
      store.addRow('productos', { codigo, nombre, costo, precio, stock, almacenId });
    }
    // Limpiamos el formulario
    setCodigo(''); setNombre(''); setCosto(0); setPrecio(0); setStock(0); setAlmacenId('');
  };

  const borrarProducto = useDelRowCallback('productos', store);

  const prepararEdicion = (id: string) => {
    const prod = store.getRow('productos', id);
    setCodigo(String(prod.codigo || ''));
    setNombre(String(prod.nombre || ''));
    setCosto(Number(prod.costo || 0));
    setPrecio(Number(prod.precio || 0));
    setStock(Number(prod.stock || 0));
    setAlmacenId(String(prod.almacenId || ''));
    setIdEditando(id);
    window.scrollTo(0, 0); // Subimos para que vea el formulario
  };

  const ProductoRow = ({ id }: { id: string }) => {
    const c = useCell('productos', id, 'codigo', store);
    const n = useCell('productos', id, 'nombre', store);
    const co = useCell('productos', id, 'costo', store);
    const p = useCell('productos', id, 'precio', store);
    const s = useCell('productos', id, 'stock', store);
    const aId = useCell('productos', id, 'almacenId', store);
    const nombreAlmacen = aId ? store.getCell('almacenes', String(aId), 'nombre') : 'Sin asignar';

    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{String(c)}</td>
        <td style={{ padding: '10px' }}>{String(n)}</td>
        <td style={{ padding: '10px' }}>{Number(co).toFixed(2)}</td>
        <td style={{ padding: '10px' }}>{Number(p).toFixed(2)}</td>
        <td style={{ padding: '10px' }}>{String(s)}</td>
        <td style={{ padding: '10px', color: '#0ea5e9' }}>{String(nombreAlmacen)}</td>
        <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
          <button onClick={() => prepararEdicion(id)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Editar</button>
          <button onClick={() => borrarProducto(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <h2>Inventario General</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Administra tus productos y asígnalos a un almacén.</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: idEditando ? '#1e3a8a' : 'transparent', padding: idEditando ? '10px' : '0', borderRadius: '8px' }}>
        {idEditando && <div style={{ width: '100%', color: 'white', marginBottom: '10px', fontWeight: 'bold' }}>✏️ Editando Producto...</div>}
        
        <input placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input type="number" placeholder="Costo" value={costo || ''} onChange={(e) => setCosto(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <input type="number" placeholder="Precio" value={precio || ''} onChange={(e) => setPrecio(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
        <input type="number" placeholder="Stock" value={stock || ''} onChange={(e) => setStock(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '80px' }} />
        
        <select value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
          <option value="">Asignar Almacén...</option>
          {almacenesIds.map((id: string) => (
            <option key={id} value={id}>{store.getCell('almacenes', id, 'nombre')}</option>
          ))}
        </select>

        <button onClick={guardarProducto} disabled={!codigo || !nombre} style={{ backgroundColor: idEditando ? '#eab308' : '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>
          {idEditando ? 'Actualizar' : 'Añadir'}
        </button>
        {idEditando && (
          <button onClick={() => { setIdEditando(null); setCodigo(''); setNombre(''); setCosto(0); setPrecio(0); setStock(0); setAlmacenId(''); }} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Cancelar</button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Código</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Producto</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Costo</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Precio</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Almacén</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosIds.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay productos. Añade el primero arriba.</td></tr>
          ) : (
            productosIds.map((id: string) => <ProductoRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </div>
  );
};