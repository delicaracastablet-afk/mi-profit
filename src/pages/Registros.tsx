import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Registros = ({ store }: { store: any }) => {
  const [pestanaInterna, setPestanaInterna] = useState<'clientes' | 'proveedores' | 'productos'>('clientes');

  // --- ESTADOS PARA FORMULARIOS ---
  const [nombre, setNombre] = useState('');
  const [rif, setRif] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  // Productos
  const [prodCodigo, setProdCodigo] = useState('');
  const [prodNombre, setProdNombre] = useState('');
  const [prodCosto, setProdCosto] = useState(0);
  const [prodPrecio, setProdPrecio] = useState(0);
  const [prodStock, setProdStock] = useState(0);

  // --- IDs DE TABLAS ---
  const clientesIds = useRowIds('clientes', store);
  const proveedoresIds = useRowIds('proveedores', store);
  const productosIds = useRowIds('productos', store);

  // --- FUNCIONES PARA AGREGAR ---
  const agregarCliente = useAddRowCallback('clientes', () => ({ nombre, rif, telefono, direccion }), [nombre, rif, telefono, direccion], store, () => {
    setNombre(''); setRif(''); setTelefono(''); setDireccion('');
  });

  const agregarProveedor = useAddRowCallback('proveedores', () => ({ nombre, rif, telefono, direccion }), [nombre, rif, telefono, direccion], store, () => {
    setNombre(''); setRif(''); setTelefono(''); setDireccion('');
  });

  const agregarProducto = useAddRowCallback('productos', () => ({ codigo: prodCodigo, nombre: prodNombre, costo: prodCosto, precio: prodPrecio, stock: prodStock }), [prodCodigo, prodNombre, prodCosto, prodPrecio, prodStock], store, () => {
    setProdCodigo(''); setProdNombre(''); setProdCosto(0); setProdPrecio(0); setProdStock(0);
  });

  // --- FUNCIONES PARA BORRAR ---
  const borrarCliente = useDelRowCallback('clientes', store);
  const borrarProveedor = useDelRowCallback('proveedores', store);
  const borrarProducto = useDelRowCallback('productos', store);

  // --- COMPONENTES DE FILAS ---
  const FilaContacto = ({ tabla, id, borrar }: { tabla: string, id: string, borrar: any }) => {
    const n = useCell(tabla, id, 'nombre', store);
    const r = useCell(tabla, id, 'rif', store);
    const t = useCell(tabla, id, 'telefono', store);
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{n}</td>
        <td style={{ padding: '10px' }}>{r}</td>
        <td style={{ padding: '10px' }}>{t}</td>
        <td style={{ padding: '10px' }}><button onClick={() => borrar(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button></td>
      </tr>
    );
  };

  const FilaProducto = ({ id }: { id: string }) => {
    const c = useCell('productos', id, 'codigo', store);
    const n = useCell('productos', id, 'nombre', store);
    const co = useCell('productos', id, 'costo', store);
    const p = useCell('productos', id, 'precio', store);
    const s = useCell('productos', id, 'stock', store);
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{c}</td><td style={{ padding: '10px' }}>{n}</td>
        <td style={{ padding: '10px' }}>{Number(co).toFixed(2)}</td><td style={{ padding: '10px' }}>{Number(p).toFixed(2)}</td>
        <td style={{ padding: '10px' }}>{s}</td>
        <td style={{ padding: '10px' }}><button onClick={() => borrarProducto(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button></td>
      </tr>
    );
  };

  return (
    <div>
      <h2>Registros Maestros</h2>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
        <button onClick={() => setPestanaInterna('clientes')} style={{ background: 'none', border: 'none', color: pestanaInterna === 'clientes' ? '#0ea5e9' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Clientes</button>
        <button onClick={() => setPestanaInterna('proveedores')} style={{ background: 'none', border: 'none', color: pestanaInterna === 'proveedores' ? '#0ea5e9' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Proveedores</button>
        <button onClick={() => setPestanaInterna('productos')} style={{ background: 'none', border: 'none', color: pestanaInterna === 'productos' ? '#0ea5e9' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Productos</button>
      </div>

      {/* VISTA CLIENTES Y PROVEEDORES */}
      {(pestanaInterna === 'clientes' || pestanaInterna === 'proveedores') && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input placeholder="Nombre / Razón Social" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
            <input placeholder="RIF / Cédula" value={rif} onChange={(e) => setRif(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
            <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
            <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
            <button 
              onClick={pestanaInterna === 'clientes' ? agregarCliente : agregarProveedor} 
              disabled={!nombre || !rif} 
              style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}
            >
              Añadir
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '15px 10px' }}>Nombre</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>RIF</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Teléfono</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th></tr></thead>
            <tbody>
              {(pestanaInterna === 'clientes' ? clientesIds : proveedoresIds).length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay registros</td></tr>
              ) : (
                (pestanaInterna === 'clientes' ? clientesIds : proveedoresIds).map((id: string) => (
                  <FilaContacto key={id} tabla={pestanaInterna === 'clientes' ? 'clientes' : 'proveedores'} id={id} borrar={pestanaInterna === 'clientes' ? borrarCliente : borrarProveedor} />
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* VISTA PRODUCTOS */}
      {pestanaInterna === 'productos' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input placeholder="Código" value={prodCodigo} onChange={(e) => setProdCodigo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
            <input placeholder="Nombre" value={prodNombre} onChange={(e) => setProdNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
            <input type="number" placeholder="Costo" value={prodCosto || ''} onChange={(e) => setProdCosto(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
            <input type="number" placeholder="Precio" value={prodPrecio || ''} onChange={(e) => setProdPrecio(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '100px' }} />
            <input type="number" placeholder="Stock" value={prodStock || ''} onChange={(e) => setProdStock(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '80px' }} />
            <button onClick={agregarProducto} disabled={!prodCodigo || !prodNombre} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Añadir</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '15px 10px' }}>Código</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Producto</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Costo</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Precio</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Stock</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th></tr></thead>
            <tbody>
              {productosIds.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay productos</td></tr>
              ) : (
                productosIds.map((id: string) => <FilaProducto key={id} id={id} />)
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};