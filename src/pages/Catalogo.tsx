import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Catalogo = ({ store }: { store: any }) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Activo');

  const cuentasIds = useRowIds('cuentas', store);
  const agregarCuenta = useAddRowCallback('cuentas', () => ({ codigo, nombre, tipo }), [codigo, nombre, tipo], store, () => {
    setCodigo(''); setNombre(''); setTipo('Activo');
  });
  const borrarCuenta = useDelRowCallback('cuentas', store);

  const CuentaRow = ({ id }: { id: string }) => {
    const c = useCell('cuentas', id, 'codigo', store);
    const n = useCell('cuentas', id, 'nombre', store);
    const t = useCell('cuentas', id, 'tipo', store);
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{c}</td><td style={{ padding: '10px' }}>{n}</td><td style={{ padding: '10px' }}>{t}</td>
        <td style={{ padding: '10px' }}><button onClick={() => borrarCuenta(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button></td>
      </tr>
    );
  };

  return (
    <>
      <h2>Catálogo de Cuentas</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
          <option value="Activo">Activo</option><option value="Pasivo">Pasivo</option><option value="Patrimonio">Patrimonio</option><option value="Ingreso">Ingreso</option><option value="Gasto">Gasto</option>
        </select>
        <button onClick={agregarCuenta} disabled={!codigo || !nombre} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Añadir</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '15px 10px' }}>Código</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Nombre</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Tipo</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th></tr></thead>
        <tbody>{cuentasIds.length === 0 ? <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Agrega cuentas primero</td></tr> : cuentasIds.map((id) => <CuentaRow key={id} id={id} />)}</tbody>
      </table>
    </>
  );
};