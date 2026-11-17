import { useCell, useRowIds } from 'tinybase/ui-react';

export const LibroDiario = ({ store }: { store: any }) => {
  const asientosIds = useRowIds('asientos', store);

  const AsientoRow = ({ id }: { id: string }) => {
    const fecha = useCell('asientos', id, 'fecha', store);
    const desc = useCell('asientos', id, 'descripcion', store);
    const todasLasLineas = store.getRowIds('lineas');
    const lineasDeAsiento = todasLasLineas.filter((lid: string) => store.getCell('lineas', lid, 'asientoId') === id);
    return (
      <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#0ea5e9' }}><strong>{fecha}</strong><span>{desc}</span></div>
        <table style={{ width: '100%', fontSize: '14px' }}><tbody>
          {lineasDeAsiento.map((lid: string) => {
            const cuentaId = store.getCell('lineas', lid, 'cuentaId');
            const cCodigo = store.getCell('cuentas', cuentaId, 'codigo');
            const cNombre = store.getCell('cuentas', cuentaId, 'nombre');
            const debe = Number(store.getCell('lineas', lid, 'debe'));
            const haber = Number(store.getCell('lineas', lid, 'haber'));
            return (
              <tr key={lid}>
                <td style={{ padding: '5px' }}>{cCodigo} - {cNombre}</td>
                <td style={{ textAlign: 'right', padding: '5px' }}>{debe > 0 ? debe.toFixed(2) : ''}</td>
                <td style={{ textAlign: 'right', padding: '5px' }}>{haber > 0 ? haber.toFixed(2) : ''}</td>
              </tr>
            );
          })}
        </tbody></table>
      </div>
    );
  };

  return (
    <div>
      <h2>Libro Diario</h2>
      {asientosIds.length === 0 ? <p style={{ color: '#888' }}>No hay asientos guardados.</p> : asientosIds.map((id: string) => <AsientoRow key={id} id={id} />)}
    </div>
  );
};