export type Pestana = 'catalogo' | 'asientos' | 'libro' | 'ventas' | 'libroFiscal' | 'compras' | 'libroCompras' | 'empleados' | 'nomina' | 'reportes' | 'productos' | 'tesoreria';

interface SidebarProps {
  empresa: string;
  pestanaActiva: Pestana;
  onCambiarPestana: (pestana: Pestana) => void;
  onLogout: () => void;
}

export const Sidebar = ({ empresa, pestanaActiva, onCambiarPestana, onLogout }: SidebarProps) => {
  const menuItems: { id: Pestana; label: string; grupo: string }[] = [
    { id: 'reportes', label: '📊 Dashboard', grupo: 'Inicio' },
    { id: 'ventas', label: '🛒 Ventas', grupo: 'Operaciones' },
    { id: 'compras', label: '📦 Compras', grupo: 'Operaciones' },
    { id: 'tesoreria', label: '🏦 Tesorería (Cobros/Pagos)', grupo: 'Operaciones' },
    { id: 'registros', label: '🗂️ Registros (Clientes/Proveedores)', grupo: 'Operaciones' },
    { id: 'empleados', label: '👥 Empleados', grupo: 'Nómina' },
    { id: 'nomina', label: '💵 Procesar Nómina', grupo: 'Nómina' },
    { id: 'catalogo', label: '📚 Catálogo de Cuentas', grupo: 'Contabilidad' },
    { id: 'asientos', label: '✍️ Asiento Manual', grupo: 'Contabilidad' },
    { id: 'libro', label: '📖 Libro Diario', grupo: 'Contabilidad' },
    { id: 'libroFiscal', label: '🧾 Libro Ventas', grupo: 'Fiscal' },
    { id: 'libroCompras', label: '🧾 Libro Compras', grupo: 'Fiscal' },
  ];

  return (
    <div style={{ width: '250px', backgroundColor: '#1f1f1f', height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
        <h2 style={{ margin: 0, color: '#0ea5e9', fontSize: '20px' }}>Profit Clone</h2>
        <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '12px' }}>{empresa}</p>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {['Inicio', 'Operaciones', 'Nómina', 'Contabilidad', 'Fiscal'].map(grupo => (
          <div key={grupo} style={{ marginBottom: '15px' }}>
            <div style={{ padding: '0 20px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{grupo}</div>
            {menuItems.filter(item => item.grupo === grupo).map(item => (
              <button
                key={item.id}
                onClick={() => onCambiarPestana(item.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px',
                  backgroundColor: pestanaActiva === item.id ? '#333' : 'transparent',
                  color: pestanaActiva === item.id ? '#0ea5e9' : '#ccc',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  borderLeft: pestanaActiva === item.id ? '3px solid #0ea5e9' : '3px solid transparent'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
        <button onClick={onLogout} style={{ width: '100%', backgroundColor: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};