import { useState } from 'react';
import { useCell, useRowIds, useDelRowCallback } from 'tinybase/ui-react';

export const Almacenes = ({ store }: { store: any }) => {
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [almacenAbierto, setAlmacenAbierto] = useState<string | null>(null);

  const almacenesIds = useRowIds('almacenes', store);
  const productosIds = useRowIds('productos', store);

  const guardarAlmacen = () => {
    if (idEditando) {
      store.setRow('almacenes', idEditando, { nombre, ubicacion });
      setIdEditando(null);
    } else {
      store.addRow('almacenes', { nombre, ubicacion });
    }
    setNombre(''); setUbicacion('');
  };

  const prepararEdicion = (id: string) => {
    const almacen = store.getRow('almacenes', id);
    setNombre(String(almacen.nombre || ''));
    setUbicacion(String(almacen.ubicacion || ''));
    setIdEditando(id);
    window.scrollTo(0, 0);
  };

  const cancelarEdicion = () => {
    setNombre(''); setUbicacion(''); setIdEditando(null);
  };

  const borrarAlmacen = useDelRowCallback('almacenes', store);

  const AlmacenRow = ({ id }: { id: string }) => {
    const n = useCell('almacenes', id, 'nombre', store);
    const u = useCell('almacenes', id, 'ubicacion', store);
    
    const productosDelAlmacen = productosIds.filter((pid: string) => store.getCell('productos', pid, 'almacenId') === id);
    const isAbierto = almacenAbierto === id;

    return (
      <>
        <tr style={{ borderBottom: '1px solid #444', backgroundColor: isAbierto ? '#333' : 'transparent' }}>
          <td style={{ padding: '10px', cursor: 'pointer', color: '#0ea5e9', fontWeight: 'bold' }} onClick={() => setAlmacenAbierto(isAbierto ? null : id)}>
            {isAbierto ? '▼' : '▶'} {String(n)}
          </td>
          <td style={{ padding: '10px' }}>{String(u)}</td>
          <td style={{ padding: '10px' }}>{productosDelAlmacen.length} productos</td>
          <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
            <button onClick={() => prepararEdicion(id)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
            <button onClick={() => borrarAlmacen(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
          </td>
        </tr>
        
        {isAbierto && (
          <tr>
            <td colSpan={4} style={{ padding: '0' }}>
              <div style={{ padding: '15px', backgroundColor: '#1f1f1f', borderBottom: '1px solid #444' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Productos en este Almacén:</h4>
                {productosDelAlmacen.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>No hay productos asignados a este almacén.</p>
                ) : (
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th style={{ textAlign: 'left', padding: '5px' }}>Código</th>
                        <th style={{ textAlign: 'left', padding: '5px' }}>Nombre</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosDelAlmacen.map((pid: string) => (
                        <tr key={pid} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '5px' }}>{store.getCell('productos', pid, 'codigo')}</td>
                          <td style={{ padding: '5px' }}>{store.getCell('productos', pid, 'nombre')}</td>
                          <td style={{ padding: '5px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{store.getCell('productos', pid, 'stock')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <>
      <h2>Gestión de Almacenes</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Haz clic en el nombre de un almacén para ver sus productos.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: idEditando ? '#1e3a8a' : 'transparent', padding: idEditando ? '10px' : '0', borderRadius: '8px' }}>
        {idEditando && <div style={{ width: '100%', color: 'white', marginBottom: '10px', fontWeight: 'bold' }}>✏️ Editando Almacén...</div>}
        
        <input placeholder="Nombre del Almacén (Ej. Central)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input placeholder="Ubicación (Ej. Caracas)" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        
        <button onClick={guardarAlmacen} disabled={!nombre} style={{ backgroundColor: idEditando ? '#eab308' : '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>
          {idEditando ? 'Actualizar' : 'Añadir'}
        </button>
        {idEditando && (
          <button onClick={cancelarEdicion} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Cancelar</button>
        )}
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Ubicación</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {almacenesIds.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay almacenes registrados. Crea el "Almacén Central" primero.</td></tr>
          ) : (
            almacenesIds.map((id) => <AlmacenRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </>
  );
};