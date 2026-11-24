import { useRowIds } from 'tinybase/ui-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Reportes = ({ store }: { store: any }) => {
  const lineasIds = useRowIds('lineas', store);
  const productosIds = useRowIds('productos', store);
  const ventasIds = useRowIds('ventas', store);

  // --- CÁLCULOS FINANCIEROS ---
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

  // --- DATOS PARA EL GRÁFICO ---
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
    .slice(-7);

  // --- PRODUCTOS CON BAJO STOCK ---
  const productosBajoStock = productosIds
    .map((id: string) => ({
      nombre: store.getCell('productos', id, 'nombre'),
      stock: Number(store.getCell('productos', id, 'stock')),
    }))
    .filter((p: any) => p.stock <= 5);

  // Formateador de moneda
  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard Financiero</h2>
          <p className="text-gray-400 text-sm mt-1">Resumen en tiempo real de tu empresa.</p>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <p className="text-gray-400 text-sm font-medium">Ingresos Totales</p>
          <p className="text-3xl font-bold text-green-400 mt-2">${fmt(totalIngresos)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <p className="text-gray-400 text-sm font-medium">Gastos Totales</p>
          <p className="text-3xl font-bold text-red-400 mt-2">${fmt(totalGastos)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${utilidad >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
          <p className="text-gray-400 text-sm font-medium">Utilidad del Ejercicio</p>
          <p className={`text-3xl font-bold mt-2 ${utilidad >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ${fmt(utilidad)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
          <p className="text-gray-400 text-sm font-medium">Efectivo / Activos</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">${fmt(totalActivos)}</p>
        </div>
      </div>

      {/* GRÁFICOS Y ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* GRÁFICO DE VENTAS */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">📈 Ventas Recientes</h3>
          {datosGrafico.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay ventas registradas para graficar.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#374151' }} 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Total Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ALERTAS DE INVENTARIO */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">⚠️ Alerta de Inventario</h3>
          {productosBajoStock.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-green-400">
              <span className="text-4xl mb-2">✓</span>
              <p className="text-sm">Todo el inventario está saludable.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {productosBajoStock.map((p, i) => (
                <li key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <span className="text-gray-300 text-sm font-medium truncate">{p.nombre}</span>
                  <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">{p.stock} uds</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};