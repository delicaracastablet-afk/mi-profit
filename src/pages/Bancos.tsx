import { useState } from 'react';
import { useCell, useRowIds, useDelRowCallback } from 'tinybase/ui-react';

export const Bancos = ({ store }: { store: any }) => {
  const [nombre, setNombre] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [moneda, setMoneda] = useState('VES');
  const [idEditando, setIdEditando] = useState<string | null>(null);

  const bancosIds = useRowIds('bancos', store);

  const guardarBanco = () => {
    if (idEditando) {
      store.setRow('bancos', idEditando, { nombre, numeroCuenta, moneda });
      setIdEditando(null);
    } else {
      store.addRow('bancos', { nombre, numeroCuenta, moneda });
    }
    setNombre(''); setNumeroCuenta(''); setMoneda('VES');
  };

  const prepararEdicion = (id: string) => {
    const banco = store.getRow('bancos', id);
    setNombre(String(banco.nombre || ''));
    setNumeroCuenta(String(banco.numeroCuenta || ''));
    setMoneda(String(banco.moneda || 'VES'));
    setIdEditando(id);
    window.scrollTo(0, 0);
  };

  const cancelarEdicion = () => {
    setNombre(''); setNumeroCuenta(''); setMoneda('VES'); setIdEditando(null);
  };

  const borrarBanco = useDelRowCallback('bancos', store);

  const BancoRow = ({ id }: { id: string }) => {
    const n = useCell('bancos', id, 'nombre', store);
    const c = useCell('bancos', id, 'numeroCuenta', store);
    const m = useCell('bancos', id, 'moneda', store);
    
    // Calcular saldo de este banco en particular
    const saldo = store.getRowIds('lineas').reduce((acc: number, lid: string) => {
      const cuentaId = store.getCell('lineas', lid, 'cuentaId');
      const cuentaNombre = store.getCell('cuentas', cuentaId, 'nombre');
      if (cuentaNombre === n) {
        const debe = Number(store.getCell('lineas', lid, 'debe'));
        const haber = Number(store.getCell('lineas', lid, 'haber'));
        return acc + (debe - haber);
      }
      return acc;
    }, 0);

    return (
      <tr style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: '10px' }}>{String(n)}</td>
        <td style={{ padding: '10px' }}>{String(c)}</td>
        <td style={{ padding: '10px' }}>{String(m)}</td>
        <td style={{ padding: '10px', color: saldo >= 0 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>{saldo.toFixed(2)}</td>
        <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
          <button onClick={() => prepararEdicion(id)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
          <button onClick={() => borrarBanco(id)} style={{ backgroundColor: '#f43f5e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
        </td>
      </tr>
    );
  };

  return (
    <>
      <h2>Cuentas Bancarias</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: idEditando ? '#1e3a8a' : 'transparent', padding: idEditando ? '10px' : '0', borderRadius: '8px' }}>
        {idEditando && <div style={{ width: '100%', color: 'white', marginBottom: '10px', fontWeight: 'bold' }}>✏️ Editando Banco...</div>}
        
        <input placeholder="Nombre del Banco (ej. Banesco)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', flex: 1 }} />
        <input placeholder="Número de Cuenta" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
        <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
          <option value="VES">Bolívares (VES)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
        
        <button onClick={guardarBanco} disabled={!nombre} style={{ backgroundColor: idEditando ? '#eab308' : '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>
          {idEditando ? 'Actualizar' : 'Añadir'}
        </button>
        {idEditando && (
          <button onClick={cancelarEdicion} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Cancelar</button>
        )}
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Banco</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Número</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Moneda</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Saldo</th>
            <th style={{ textAlign: 'left', padding: '15px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bancosIds.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay bancos registrados</td></tr>
          ) : (
            bancosIds.map((id) => <BancoRow key={id} id={id} />)
          )}
        </tbody>
      </table>
    </>
  );
};