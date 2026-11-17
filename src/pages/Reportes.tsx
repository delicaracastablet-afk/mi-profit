import { useRowIds } from 'tinybase/ui-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Reportes = ({ store }: { store: any }) => {
  const lineasIds = useRowIds('lineas', store);
  const productosIds = useRowIds('productos', store);
  const ventasIds = useRowIds('ventas', store);

  // --- 1. CÁLCULOS FINANCIEROS ---
  const calcularTotalesPorTipo = (tipoCuenta: string) => {
    let total = 0;
    lineasIds.forEach((lid: string) => {
      const cuentaId = store.getCell('lineas', lid, 'cuentaId');
      const t = store.getCell('cuentas', cuentaId, 'tipo');
      if (t === tipoCuenta) {
        const debe = Number(store.getCell('lineas', lid, 'debe'));
        const haber = Number(store.getCell('lineas', lid, 'haber'));
        if (tipoCuenta === 'Ingreso' || tipoCuenta === 'Pasivo' || tipoCuenta === 'Patrimonio') {
          total += (haber - debe);
        } else {
          total += (debe - haber);
        }
      }
    });
    return total;
  };

  const totalIngresos = calcularTotalesPorTipo('Ingreso');
  const totalGastos = calcularTotalesPorTipo('Gasto');
  const utilidad = totalIngresos - totalGastos;
  const totalActivos = calcularTotalesPorTipo('Activo');

  // --- 2. DATOS PARA EL GRÁFICO DE VENTAS ---
  // Agrupamos las ventas por fecha
  const ventasPorFecha = ventasIds.reduce((acc: any, id: string) => {
    const fecha = store.getCell('ventas', id, 'fecha');
    const total = Number(store.getCell('ventas', id, 'total'));
    if (!acc[fecha]) acc[fecha] = 0;
    acc[fecha] += total;
    return acc;
  }, {});

  const datosGrafico = Object.keys(ventasPorFecha)
    .map(fecha => ({ fecha, total: ventasPorFecha[fecha] }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-7); // Solo mostramos los últimos 7 días

  // --- 3. PRODUCTOS CON BAJO STOCK ---
  const productosBajoStock = productosIds
    .map((id: string) => ({
      nombre: store.getCell('productos', id, 'nombre'),
      stock: Number(store.getCell('productos', id, 'stock')),
    }))
    .filter((p: any) => p.stock <= 5);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard Financiero</h2>

      {/* TARJETAS DE RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #10b981' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Ingresos Totales</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{totalIngresos.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f43f5e' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Gastos Totales</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f43f5e' }}>{totalGastos.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: `5px solid ${utilidad >= 0 ? '#0ea5e9' : '#f43f5e'}` }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Utilidad del Ejercicio</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: utilidad >= 0 ? '#0ea5e9' : '#f43f5e' }}>{utilidad.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #eab308' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Efectivo / Activos</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eab308' }}>{totalActivos.toFixed(2)}</div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS Y ALERTAS */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* GRÁFICO DE VENTAS */}
        <div style={{ flex: 2, minWidth: '400px', backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Ventas de los últimos días</h3>
          {datosGrafico.length === 0 ? (
            <p style={{ color: '#888' }}>No hay ventas registradas para graficar.</p>
          ) : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico}>
                  <XAxis dataKey="fecha" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip cursor={{ fill: '#333' }} contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: '8px' }} />
                  <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ALERTAS DE INVENTARIO */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#f43f5e' }}>⚠️ Alerta de Inventario</h3>
          {productosBajoStock.length === 0 ? (
            <p style={{ color: '#10b981', fontSize: '14px' }}>Todo el inventario está saludable.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {productosBajoStock.map((p, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #444', fontSize: '14px' }}>
                  <span>{p.nombre}</span>
                  <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{p.stock} uds</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};