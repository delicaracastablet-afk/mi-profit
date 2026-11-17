import { useState } from 'react';
import { useCell, useRowIds, useAddRowCallback, useDelRowCallback } from 'tinybase/ui-react';

export const Empleados = ({ store }: { store: any }) => {
  const [empNombre, setEmpNombre] = useState('');
  const [empCedula, setEmpCedula] = useState('');
  const [empCargo, setEmpCargo] = useState('Empleado');
  const [empSueldo, setEmpSueldo] = useState(0);

  const empleadosIds = useRowIds('empleados', store);
  const agregarEmpleado = useAddRowCallback('empleados', () => ({ nombre: empNombre, cedula: empCedula, cargo: empCargo, sueldoBase: empSueldo }), [empNombre, empCedula, empCargo, empSueldo], store, () => {
    setEmpNombre(''); setEmpCedula(''); setEmpCargo('Empleado'); setEmpSueldo(0);
  });
  const borrarEmpleado = useDelRowCallback('empleados', store);

  const EmpleadoRow = ({ id }: { id: string }) => {
    const n = useCell('empleados', id, 'nombre', store);
    const c = useCell('empleados', id, 'cedula', store);
    const ca = useCell('empleados', id, 'cargo', store);
    const s = useCell('empleados', id, 'sueldoBase', store);
    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{n}</td><td style={{ padding: '10px' }}>{c}</td><td style={{ padding: '10px' }}>{ca}</td><td style={{ padding: '10px' }}>{Number(s).toFixed(2)}</td>
        <td style={{ padding: '10px' }}><button onClick={() => borrarEmpleado(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Borrar</button></td>
      </tr>
    );
  };

  return (
    <>
      <h2>Registro de Empleados</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input placeholder="Nombre completo" value={empNombre} onChange={(e) => setEmpNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input placeholder="Cédula" value={empCedula} onChange={(e) => setEmpCedula(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <input placeholder="Cargo" value={empCargo} onChange={(e) => setEmpCargo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <input type="number" placeholder="Sueldo Base" value={empSueldo || ''} onChange={(e) => setEmpSueldo(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <button onClick={agregarEmpleado} disabled={!empNombre || !empCedula} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Añadir</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '15px 10px' }}>Nombre</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Cédula</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Cargo</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Sueldo</th><th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th></tr></thead>
        <tbody>{empleadosIds.length === 0 ? <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Agrega empleados primero</td></tr> : empleadosIds.map((id) => <EmpleadoRow key={id} id={id} />)}</tbody>
      </table>
    </>
  );
};