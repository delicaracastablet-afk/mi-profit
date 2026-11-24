import { useState } from 'react';
import { useCell, useRowIds, useDelRowCallback } from 'tinybase/ui-react';

export const Registros = ({ store }: { store: any }) => {
  const [pestanaInterna, setPestanaInterna] = useState<'clientes' | 'proveedores'>('clientes');

  // --- ESTADOS PARA FORMULARIOS ---
  const [nombre, setNombre] = useState('');
  const [rif, setRif] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  // --- ESTADOS DE EDICIÓN ---
  const [idEditandoCliente, setIdEditandoCliente] = useState<string | null>(null);
  const [idEditandoProveedor, setIdEditandoProveedor] = useState<string | null>(null);

  // --- IDs DE TABLAS ---
  const clientesIds = useRowIds('clientes', store);
  const proveedoresIds = useRowIds('proveedores', store);

  // --- FUNCIÓN PARA GUARDAR (CREAR O ACTUALIZAR) ---
  const guardarContacto = () => {
    if (pestanaInterna === 'clientes') {
      if (idEditandoCliente) {
        store.setRow('clientes', idEditandoCliente, { nombre, rif, telefono, direccion });
        setIdEditandoCliente(null);
      } else {
        store.addRow('clientes', { nombre, rif, telefono, direccion });
      }
    } else {
      if (idEditandoProveedor) {
        store.setRow('proveedores', idEditandoProveedor, { nombre, rif, telefono, direccion });
        setIdEditandoProveedor(null);
      } else {
        store.addRow('proveedores', { nombre, rif, telefono, direccion });
      }
    }
    // Limpiamos el formulario
    setNombre(''); setRif(''); setTelefono(''); setDireccion('');
  };

  // --- FUNCIÓN PARA PREPARAR LA EDICIÓN ---
  const prepararEdicion = (id: string) => {
    const contacto = store.getRow(pestanaInterna, id);
    setNombre(contacto.nombre || '');
    setRif(contacto.rif || '');
    setTelefono(contacto.telefono || '');
    setDireccion(contacto.direccion || '');
    
    if (pestanaInterna === 'clientes') setIdEditandoCliente(id);
    else setIdEditandoProveedor(id);
    
    window.scrollTo(0, 0); // Sube al inicio para ver el formulario
  };

  const cancelarEdicion = () => {
    setNombre(''); setRif(''); setTelefono(''); setDireccion('');
    setIdEditandoCliente(null); setIdEditandoProveedor(null);
  };

  // --- FUNCIONES PARA BORRAR ---
  const borrarCliente = useDelRowCallback('clientes', store);
  const borrarProveedor = useDelRowCallback('proveedores', store);

  // --- COMPONENTES DE FILAS ---
  const FilaContacto = ({ tabla, id, borrar }: { tabla: string, id: string, borrar: any }) => {
    const n = useCell(tabla, id, 'nombre', store);
    const r = useCell(tabla, id, 'rif', store);
    const t = useCell(tabla, id, 'telefono', store);
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{String(n)}</td>
        <td style={{ padding: '10px' }}>{String(r)}</td>
        <td style={{ padding: '10px' }}>{String(t)}</td>
        <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
          <button onClick={() => prepararEdicion(id)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
          <button onClick={() => borrar(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
        </td>
      </tr>
    );
  };

  const isEditando = pestanaInterna === 'clientes' ? idEditandoCliente !== null : idEditandoProveedor !== null;

  return (
    <div>
      <h2>Registros Maestros</h2>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
        <button onClick={() => { setPestanaInterna('clientes'); cancelarEdicion(); }} style={{ background: 'none', border: 'none', color: pestanaInterna === 'clientes' ? '#0ea5e9' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Clientes</button>
        <button onClick={() => { setPestanaInterna('proveedores'); cancelarEdicion(); }} style={{ background: 'none', border: 'none', color: pestanaInterna === 'proveedores' ? '#0ea5e9' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Proveedores</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: isEditando ? '#1e3a8a' : 'transparent', padding: isEditando ? '10px' : '0', borderRadius: '8px' }}>
        {isEditando && <div style={{ width: '100%', color: 'white', marginBottom: '10px', fontWeight: 'bold' }}>✏️ Editando {pestanaInterna === 'clientes' ? 'Cliente' : 'Proveedor'}...</div>}
        
        <input placeholder="Nombre / Razón Social" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input placeholder="RIF / Cédula" value={rif} onChange={(e) => setRif(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        
        <button onClick={guardarContacto} disabled={!nombre || !rif} style={{ backgroundColor: isEditando ? '#eab308' : '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>
          {isEditando ? 'Actualizar' : 'Añadir'}
        </button>
        
        {isEditando && (
          <button onClick={cancelarEdicion} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Cancelar</button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>RIF</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Teléfono</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(pestanaInterna === 'clientes' ? clientesIds : proveedoresIds).length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay registros</td></tr>
          ) : (
            (pestanaInterna === 'clientes' ? clientesIds : proveedoresIds).map((id: string) => (
              <FilaContacto key={id} tabla={pestanaInterna} id={id} borrar={pestanaInterna === 'clientes' ? borrarCliente : borrarProveedor} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};