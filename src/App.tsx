import './index.css'; 
import { useState, useEffect } from 'react';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { useCreateStore, useCreatePersister } from 'tinybase/ui-react';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';

// Importamos el menú y las páginas
import { Sidebar, Pestana } from './components/Sidebar';
import { Catalogo } from './pages/Catalogo';
import { Asientos } from './pages/Asientos';
import { Ventas } from './pages/Ventas';
import { Pedidos } from './pages/Pedidos';
import { NotasEntrega } from './pages/NotasEntrega';
import { Compras } from './pages/Compras';
import { Almacenes } from './pages/Almacenes';
import { Inventario } from './pages/Inventario';
import { Transferencias } from './pages/Transferencias';
import { Devoluciones } from './pages/Devoluciones';
import { Tesoreria } from './pages/Tesoreria';
import { Registros } from './pages/Registros';
import { Empleados } from './pages/Empleados';
import { Nomina } from './pages/Nomina';
import { Reportes } from './pages/Reportes';
import { ReportesPdf } from './pages/ReportesPdf';
import { LibroDiario } from './pages/LibroDiario';
import { LibrosFiscales } from './pages/LibrosFiscales';

// --- COMPONENTE DE LOGIN ---
const Login = ({ onLogin }: { onLogin: (empresa: string, rol: 'admin' | 'vendedor') => void }) => {
  const [empresa, setEmpresa] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor'>('admin');
  const [error, setError] = useState('');

  const CLAVE_MAESTRA = "admin123"; 

  const handleLogin = () => {
    if (!empresa.trim()) return setError("Escribe el nombre de la empresa");
    
    if (password === CLAVE_MAESTRA) {
      onLogin(empresa.trim(), rol);
    } else {
      setError("Contraseña incorrecta. Intenta de nuevo.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
      <img src="/logo.png" alt="Logo" className="w-48 mb-6" />
      <h1 className="text-2xl font-bold text-blue-500 mb-2 text-center px-4">DISTRIBUIDORA NAPOLES 2026 C.A.</h1>
      <p className="text-gray-400 mb-8">Acceso al Sistema Administrativo</p>
      
      <div className="flex flex-col gap-4 w-80">
        <input 
          placeholder="Nombre de la Empresa" 
          value={empresa} 
          onChange={(e) => { setEmpresa(e.target.value); setError(''); }} 
          className="px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
        
        <input 
          type="password"
          placeholder="Contraseña de Acceso" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(''); }} 
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />

        <div>
          <label className="block mb-1 text-sm text-gray-400">Tipo de Usuario</label>
          <select 
            value={rol} 
            onChange={(e) => setRol(e.target.value as 'admin' | 'vendedor')}
            className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="admin">Administrador (Acceso Total)</option>
            <option value="vendedor">Vendedor (Solo Pedidos)</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm m-0">{error}</p>}

        <button 
          onClick={handleLogin} 
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
        >
          Entrar al Sistema
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const App = () => {
  const [empresaActiva, setEmpresaActiva] = useState<string | null>(null);
  const [rolActivo, setRolActivo] = useState<'admin' | 'vendedor'>('admin');

  if (!empresaActiva) {
    return <Login onLogin={(nombre, rol) => { setEmpresaActiva(nombre); setRolActivo(rol); }} />;
  }
  
  return <SistemaContable empresa={empresaActiva} rol={rolActivo} onLogout={() => setEmpresaActiva(null)} />;
};

// --- EL SISTEMA CONTABLE ---
const SistemaContable = ({ empresa, rol, onLogout }: { empresa: string; rol: 'admin' | 'vendedor'; onLogout: () => void }) => {
  // Si es vendedor, arranca en la pestaña de pedidos
  const [pestana, setPestana] = useState<Pestana>(rol === 'vendedor' ? 'pedidos' : 'reportes');
  const [tasaGlobal, setTasaGlobal] = useState(36.50);

  const store = useCreateStore(() =>
    createStore().setTablesSchema({
      cuentas: { codigo: { type: 'string' }, nombre: { type: 'string' }, tipo: { type: 'string' } },
      asientos: { fecha: { type: 'string' }, descripcion: { type: 'string' } },
      lineas: { asientoId: { type: 'string' }, cuentaId: { type: 'string' }, debe: { type: 'number' }, haber: { type: 'number' } },
      ventas: { 
        fecha: { type: 'string' }, rif: { type: 'string' }, numeroFactura: { type: 'string' }, baseImponible: { type: 'number' }, iva: { type: 'number' }, total: { type: 'number' },
        condicion: { type: 'string' }, vencimiento: { type: 'string' }, contenido: { type: 'string' }, tasaBCV: { type: 'number' }
      },
      pedidos: { 
        fecha: { type: 'string' }, vendedor: { type: 'string' }, rifCliente: { type: 'string' }, nombreCliente: { type: 'string' }, telefonoCliente: { type: 'string' }, codigoSunagro: { type: 'string' }, horarioRecepcion: { type: 'string' }, contenido: { type: 'string' }, observaciones: { type: 'string' }, monedaPago: { type: 'string' }, condicionPago: { type: 'string' } 
      },
      compras: { 
        fecha: { type: 'string' }, rif: { type: 'string' }, numeroFactura: { type: 'string' }, baseImponible: { type: 'number' }, iva: { type: 'number' }, total: { type: 'number' }, condicion: { type: 'string' }, vencimiento: { type: 'string' }, tasaBCV: { type: 'number' }
      },
      notas_entrega: { 
        fecha: { type: 'string' }, rifCliente: { type: 'string' }, nombreCliente: { type: 'string' }, contenido: { type: 'string' }, observaciones: { type: 'string' }, tasaBCV: { type: 'number' }
      },
      configuracion: { tasaBCV: { type: 'number' } },
      historial_tasas: { fecha: { type: 'string' }, tasa: { type: 'number' } },
      almacenes: { nombre: { type: 'string' }, ubicacion: { type: 'string' } },
      transferencias: { fecha: { type: 'string' }, origen: { type: 'string' }, destino: { type: 'string' }, producto: { type: 'string' }, cantidad: { type: 'number' } },
      clientes: { nombre: { type: 'string' }, rif: { type: 'string' }, telefono: { type: 'string' }, direccion: { type: 'string' } },
      proveedores: { nombre: { type: 'string' }, rif: { type: 'string' }, telefono: { type: 'string' }, direccion: { type: 'string' } },
      productos: { codigo: { type: 'string' }, nombre: { type: 'string' }, costo: { type: 'number' }, precio: { type: 'number' }, stock: { type: 'number' }, almacenId: { type: 'string' } },
      empleados: { nombre: { type: 'string' }, cedula: { type: 'string' }, cargo: { type: 'string' }, sueldoBase: { type: 'number' } },
      nominas: { empleadoId: { type: 'string' }, fecha: { type: 'string' }, sueldo: { type: 'number' }, cestaticket: { type: 'number' }, deducciones: { type: 'number' }, neto: { type: 'number' } },
    })
  );

  useEffect(() => {
    const tasaGuardada = store.getCell('configuracion', 'tasa', 'tasaBCV');
    if (tasaGuardada) setTasaGlobal(Number(tasaGuardada));
  }, [store]);

  const handleCambiarTasa = (nuevaTasa: number) => {
    setTasaGlobal(nuevaTasa);
    store.setCell('configuracion', 'tasa', 'tasaBCV', nuevaTasa);

    const fechaHoy = new Date().toISOString().split('T')[0];
    const historialIds = store.getRowIds('historial_tasas');
    const registroExistente = historialIds.find(id => store.getCell('historial_tasas', id, 'fecha') === fechaHoy);

    if (registroExistente) store.setCell('historial_tasas', registroExistente, 'tasa', nuevaTasa);
    else store.addRow('historial_tasas', { fecha: fechaHoy, tasa: nuevaTasa });
  };

  useCreatePersister(store, (s) => createLocalPersister(s, `mi-profit/${empresa}`), [empresa], async (p) => {
    await p.startAutoLoad();
    await p.startAutoSave();
  });

  useCreatePersister(store, (s: any) => createWsSynchronizer(s, new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/mi-profit-sync')), [], async (synchronizer: any) => {
    await synchronizer.startSync();
  });

  // --- VISTA PARA VENDEDORES ---
  if (rol === 'vendedor') {
    return (
      <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-blue-500">DISTRIBUIDORA NAPOLES 2026 C.A.</h1>
              <button onClick={onLogout} className="bg-gray-800 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-all font-semibold text-sm">
                Cerrar Sesión
              </button>
            </div>
            {/* Solo renderizamos Pedidos */}
            <Pedidos store={store} />
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PARA ADMINISTRADORES (Sistema Completo) ---
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      <Sidebar 
        empresa={empresa} 
        pestanaActiva={pestana} 
        onCambiarPestana={setPestana} 
        onLogout={onLogout} 
        tasaGlobal={tasaGlobal} 
        onCambiarTasa={handleCambiarTasa}
      />
      
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {pestana === 'catalogo' && <Catalogo store={store} />}
        {pestana === 'asientos' && <Asientos store={store} irAlLibro={() => setPestana('libro')} />}
        {pestana === 'ventas' && <Ventas store={store} tasaGlobal={tasaGlobal} irAlibroFiscal={() => setPestana('libroFiscal')} />}
        {pestana === 'pedidos' && <Pedidos store={store} />} 
        {pestana === 'notasEntrega' && <NotasEntrega store={store} tasaGlobal={tasaGlobal} />} 
        {pestana === 'compras' && <Compras store={store} irAlibroCompras={() => setPestana('libroCompras')} />}
        {pestana === 'almacenes' && <Almacenes store={store} />}
        {pestana === 'inventario' && <Inventario store={store} />}
        {pestana === 'transferencias' && <Transferencias store={store} />}  
        {pestana === 'tesoreria' && <Tesoreria store={store} />}
        {pestana === 'registros' && <Registros store={store} />}
        {pestana === 'devoluciones' && <Devoluciones store={store} irAlLibro={() => setPestana('libro')} />}
        {pestana === 'empleados' && <Empleados store={store} />}
        {pestana === 'nomina' && <Nomina store={store} irAlLibro={() => setPestana('libro')} />}
        {pestana === 'reportes' && <Reportes store={store} />}
        {pestana === 'reportesPdf' && <ReportesPdf store={store} />}
        {pestana === 'libro' && <LibroDiario store={store} />}
        {(pestana === 'libroFiscal' || pestana === 'libroCompras') && <LibrosFiscales store={store} />}
      </div>
    </div>
  );
};

export { App };