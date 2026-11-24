export type Pestana = 'catalogo' | 'asientos' | 'libro' | 'ventas' | 'libroFiscal' | 'compras' | 'libroCompras' | 'empleados' | 'nomina' | 'reportes' | 'productos' | 'tesoreria' | 'registros' | 'bancos' | 'devoluciones' | 'pedidos' | 'reportesPdf' | 'almacenes' | 'transferencias' | 'inventario' | 'notasEntrega';

interface SidebarProps {
  empresa: string;
  pestanaActiva: Pestana;
  onCambiarPestana: (pestana: Pestana) => void;
  onLogout: () => void;
  tasaGlobal: number; // <-- NUEVO
  onCambiarTasa: (nuevaTasa: number) => void; // <-- NUEVO
}

export const Sidebar = ({ empresa, pestanaActiva, onCambiarPestana, onLogout, tasaGlobal, onCambiarTasa }: SidebarProps) => {
  const menuItems: { id: Pestana; label: string; grupo: string }[] = [
    { id: 'reportes', label: '📊 Dashboard', grupo: 'Inicio' },
    { id: 'ventas', label: '🛒 Ventas', grupo: 'Operaciones' },
    { id: 'notasEntrega', label: '📝 Notas de Entrega', grupo: 'Operaciones' },
    { id: 'pedidos', label: '📱 Toma de Pedidos', grupo: 'Operaciones' },
    { id: 'compras', label: '📦 Compras', grupo: 'Operaciones' },
    { id: 'devoluciones', label: '↩️ Devoluciones', grupo: 'Operaciones' },
    { id: 'tesoreria', label: '🏦 Tesorería', grupo: 'Operaciones' },
    { id: 'registros', label: '🗂️ Registros', grupo: 'Operaciones' },
    { id: 'inventario', label: '🏷️ Inventario', grupo: 'Operaciones' },
    { id: 'almacenes', label: '🏭 Almacenes', grupo: 'Operaciones' },
    { id: 'transferencias', label: '🔄 Transferencias', grupo: 'Operaciones' },
    { id: 'empleados', label: '👥 Empleados', grupo: 'Nómina' },
    { id: 'nomina', label: '💵 Procesar Nómina', grupo: 'Nómina' },
    { id: 'catalogo', label: '📚 Catálogo de Cuentas', grupo: 'Contabilidad' },
    { id: 'asientos', label: '✍️ Asiento Manual', grupo: 'Contabilidad' },
    { id: 'libro', label: '📖 Libro Diario', grupo: 'Contabilidad' },
    { id: 'libroFiscal', label: '🧾 Libro Ventas', grupo: 'Fiscal' },
    { id: 'libroCompras', label: '🧾 Libro Compras', grupo: 'Fiscal' },
    { id: 'reportesPdf', label: '📄 Reportes PDF', grupo: 'Fiscal' },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col border-r border-gray-800">
      <div className="p-4 border-b border-gray-800 flex flex-col items-center">
        <img src="/logo.png" alt="Logo" className="w-24 mb-2" />
        <h2 className="text-sm font-bold text-blue-500 text-center leading-tight">DISTRIBUIDORA NAPOLES 2026 C.A.</h2>
        <p className="text-gray-400 text-[10px] mt-1 truncate w-full text-center">{empresa}</p>
        
        {/* CAMPO DE TASA DE CAMBIO GLOBAL */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <label className="text-xs text-gray-400 font-bold block mb-1">💱 TASA BCV (Bs/$)</label>
          <input 
            type="number" 
            step="0.01"
            value={tasaGlobal}
            onChange={(e) => onCambiarTasa(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {['Inicio', 'Operaciones', 'Nómina', 'Contabilidad', 'Fiscal'].map(grupo => (
          <div key={grupo} className="mb-4">
            <div className="px-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{grupo}</div>
            {menuItems.filter(item => item.grupo === grupo).map(item => (
              <button
                key={item.id}
                onClick={() => onCambiarPestana(item.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-all border-l-4 ${
                  pestanaActiva === item.id 
                    ? 'bg-gray-800 text-blue-400 border-blue-500' 
                    : 'text-gray-400 border-transparent hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800">
        <button onClick={onLogout} className="w-full bg-transparent text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-all font-semibold text-sm">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};