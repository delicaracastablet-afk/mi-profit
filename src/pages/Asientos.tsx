import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Asientos = ({ store, irAlLibro }: { store: any, irAlLibro: () => void }) => {
  const [fechaAsiento, setFechaAsiento] = useState(new Date().toISOString().split('T')[0]);
  const [descripcionAsiento, setDescripcionAsiento] = useState('');
  const [lineas, setLineas] = useState([{ cuentaId: '', debe: 0, haber: 0 }]);
  
  const cuentasIds = useRowIds('cuentas', store);
  const totalDebe = lineas.reduce((acc, l) => acc + Number(l.debe), 0);
  const totalHaber = lineas.reduce((acc, l) => acc + Number(l.haber), 0);
  const cuadrado = totalDebe === totalHaber && totalDebe > 0;

  const guardarAsientoManual = () => {
    if (!cuadrado || !descripcionAsiento) return;
    const asientoId = store.addRow('asientos', { fecha: fechaAsiento, descripcion: descripcionAsiento });
    lineas.forEach(l => {
      if (l.cuentaId) store.addRow('lineas', { asientoId, cuentaId: l.cuentaId, debe: Number(l.debe), haber: Number(l.haber) });
    });
    setDescripcionAsiento(''); setLineas([{ cuentaId: '', debe: 0, haber: 0 }]);
    alert("¡Asiento guardado!"); irAlLibro();
  };

  return (
    <div>
      <h2>Nuevo Asiento Manual</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
         <input type="date" value={fechaAsiento} onChange={(e) => setFechaAsiento(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
         <input placeholder="Descripción del asiento" value={descripcionAsiento} onChange={(e) => setDescripcionAsiento(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '10px' }}>Cuenta</th><th style={{ textAlign: 'right', padding: '10px' }}>Debe</th><th style={{ textAlign: 'right', padding: '10px' }}>Haber</th><th style={{ textAlign: 'center', padding: '10px' }}>X</th></tr></thead>
        <tbody>
          {lineas.map((linea, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '10px' }}>
                <select value={linea.cuentaId} onChange={(e) => { const newL = [...lineas]; newL[index].cuentaId = e.target.value; setLineas(newL); }} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
                  <option value="">Selecciona...</option>
                  {cuentasIds.map((id: string) => <option key={id} value={id}>{store.getCell('cuentas', id, 'codigo')} - {store.getCell('cuentas', id, 'nombre')}</option>)}
                </select>
              </td>
              <td style={{ padding: '10px' }}><input type="number" value={linea.debe || ''} onChange={(e) => { const newL = [...lineas]; newL[index].debe = Number(e.target.value); newL[index].haber = 0; setLineas(newL); }} style={{ width: '100%', padding: '8px', textAlign: 'right', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} /></td>
              <td style={{ padding: '10px' }}><input type="number" value={linea.haber || ''} onChange={(e) => { const newL = [...lineas]; newL[index].haber = Number(e.target.value); newL[index].debe = 0; setLineas(newL); }} style={{ width: '100%', padding: '8px', textAlign: 'right', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} /></td>
              <td style={{ padding: '10px', textAlign: 'center' }}><button onClick={() => setLineas(lineas.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '18px' }}>X</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setLineas([...lineas, { cuentaId: '', debe: 0, haber: 0 }])} style={{ backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>+ Añadir línea</button>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Debe: {totalDebe.toFixed(2)} | Haber: {totalHaber.toFixed(2)}</div>
      </div>
      <div style={{ padding: '15px', borderRadius: '4px', marginBottom: '20px', backgroundColor: cuadrado ? '#065f46' : '#7f1d1d' }}>{cuadrado ? '✅ ¡Asiento Cuadrado!' : '❌ Descuadrado'}</div>
      <button onClick={guardarAsientoManual} disabled={!cuadrado || !descripcionAsiento} style={{ backgroundColor: cuadrado && descripcionAsiento ? '#0ea5e9' : '#555', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold' }}>Guardar Asiento</button>
    </div>
  );
};