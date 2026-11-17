import { useRowIds } from 'tinybase/ui-react';

export const Nomina = ({ store, irAlLibro }: { store: any, irAlLibro: () => void }) => {
  const empleadosIds = useRowIds('empleados', store);
  const nominasIds = useRowIds('nominas', store);

  const procesarNomina = () => {
    if (empleadosIds.length === 0) return alert("No hay empleados registrados.");
    
    const buscarOCrearCuenta = (cod: string, nom: string, tip: string) => {
      const existente = store.getRowIds('cuentas').find((id: string) => store.getCell('cuentas', id, 'codigo') === cod);
      if (existente) return existente;
      return store.addRow('cuentas', { codigo: cod, nombre: nom, tipo: tip });
    };

    const cGastoNomina = buscarOCrearCuenta('5101', 'Gasto de Nómina', 'Gasto');
    const cGastoCestaticket = buscarOCrearCuenta('5102', 'Gasto Cestaticket', 'Gasto');
    const cRetenciones = buscarOCrearCuenta('2202', 'Retenciones Laborales', 'Pasivo');
    const cBanco = buscarOCrearCuenta('1102', 'Banco', 'Activo');

    let totalSueldos = 0, totalCestaticket = 0, totalDeducciones = 0, totalNeto = 0;

    empleadosIds.forEach(id => {
      const sueldoBase = Number(store.getCell('empleados', id, 'sueldoBase'));
      const cestaticket = 40;
      const ivss = sueldoBase * 0.04;
      const paroForzoso = sueldoBase * 0.005;
      const faov = sueldoBase * 0.01;
      const deducciones = ivss + paroForzoso + faov;
      const neto = (sueldoBase + cestaticket) - deducciones;

      store.addRow('nominas', { empleadoId: id, fecha: new Date().toISOString().split('T')[0], sueldo: sueldoBase, cestaticket, deducciones, neto });

      totalSueldos += sueldoBase;
      totalCestaticket += cestaticket;
      totalDeducciones += deducciones;
      totalNeto += neto;
    });

    const asientoId = store.addRow('asientos', { fecha: new Date().toISOString().split('T')[0], descripcion: 'Pago de Nómina del Mes' });
    store.addRow('lineas', { asientoId, cuentaId: cGastoNomina, debe: totalSueldos, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cGastoCestaticket, debe: totalCestaticket, haber: 0 });
    store.addRow('lineas', { asientoId, cuentaId: cRetenciones, debe: 0, haber: totalDeducciones });
    store.addRow('lineas', { asientoId, cuentaId: cBanco, debe: 0, haber: totalNeto });

    alert("Nómina procesada.");
    irAlLibro();
  };

  return (
    <div>
      <h2>Procesar Nómina</h2>
      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px', marginBottom: '30px' }}>
        <p>Al presionar el botón, el sistema calculará las deducciones de ley, sumará el cestaticket y generará el asiento contable automáticamente.</p>
        <button onClick={procesarNomina} disabled={empleadosIds.length === 0} style={{ backgroundColor: empleadosIds.length > 0 ? '#10b981' : '#555', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%', cursor: empleadosIds.length > 0 ? 'pointer' : 'not-allowed', marginTop: '20px' }}>
          Procesar Nómina del Mes
        </button>
      </div>
      
      <h3>Historial de Nóminas</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', fontSize: '14px' }}>
        <thead style={{ backgroundColor: '#1f1f1f' }}><tr><th style={{ textAlign: 'left', padding: '10px' }}>Empleado</th><th style={{ textAlign: 'right', padding: '10px' }}>Sueldo</th><th style={{ textAlign: 'right', padding: '10px' }}>Cestaticket</th><th style={{ textAlign: 'right', padding: '10px' }}>Deducciones</th><th style={{ textAlign: 'right', padding: '10px' }}>Neto Pagado</th></tr></thead>
        <tbody>
          {nominasIds.length === 0 ? <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay nóminas procesadas.</td></tr> : nominasIds.map(id => {
            const n = store.getRow('nominas', id);
            const empId = n.empleadoId;
            const empNombre = store.getCell('empleados', empId, 'nombre');
            return (
              <tr key={id} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ padding: '10px' }}>{empNombre}</td>
                <td style={{ textAlign: 'right', padding: '10px' }}>{Number(n.sueldo).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px' }}>{Number(n.cestaticket).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px', color: '#f43f5e' }}>-{Number(n.deducciones).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>{Number(n.neto).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};