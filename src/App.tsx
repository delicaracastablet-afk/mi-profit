import { useState } from 'react';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { useCreateStore, useCreatePersister } from 'tinybase/ui-react';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';

// Importamos el menú y las páginas
import { Sidebar, Pestana } from './components/Sidebar';
import { Catalogo } from './pages/Catalogo';
import { Asientos } from './pages/Asientos';
import { Ventas } from './pages/Ventas';
import { Compras } from './pages/Compras';
import { Tesoreria } from './pages/Tesoreria';
import { Registros } from './pages/Registros';
import { Empleados } from './pages/Empleados';
import { Nomina } from './pages/Nomina';
import { Reportes } from './pages/Reportes';
import { LibroDiario } from './pages/LibroDiario';
import { LibrosFiscales } from './pages/LibrosFiscales';

const Login = ({ onLogin }: { onLogin: (empresa: string) => void }) => {
  const [empresa, setEmpresa] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // AQUÍ DEFINES TU CONTRASEÑA MAESTRA
  const CLAVE_MAESTRA = "admin123"; 

  const handleLogin = () => {
    if (!empresa.trim()) return setError("Escribe el nombre de la empresa");
    
    if (password === CLAVE_MAESTRA) {
      onLogin(empresa.trim());
    } else {
      setError("Contraseña incorrecta. Intenta de nuevo.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#111', color: 'white' }}>
      <h1 style={{ color: '#0ea5e9', marginBottom: '10px' }}>Profit Clone</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>Acceso al Sistema Administrativo</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <input 
          placeholder="Nombre de la Empresa" 
          value={empresa} 
          onChange={(e) => { setEmpresa(e.target.value); setError(''); }} 
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} 
        />
        
        <input 
          type="password"
          placeholder="Contraseña de Acceso" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(''); }} 
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} 
        />

        {error && <p style={{ color: '#f43f5e', fontSize: '12px', margin: 0 }}>{error}</p>}

        <button 
          onClick={handleLogin} 
          style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
        >
          Entrar al Sistema
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [empresaActiva, setEmpresaActiva] = useState<string | null>(null);
  if (!empresaActiva) return <Login onLogin={(nombre) => setEmpresaActiva(nombre)} />;
  return <SistemaContable empresa={empresaActiva} onLogout={() => setEmpresaActiva(null)} />;
};

const SistemaContable = ({ empresa, onLogout }: { empresa: string; onLogout: () => void }) => {
  const [pestana, setPestana] = useState<Pestana>('reportes');

  const store = useCreateStore(() =>
    createStore().setTablesSchema({
      cuentas: { codigo: { type: 'string' }, nombre: { type: 'string' }, tipo: { type: 'string' } },
      asientos: { fecha: { type: 'string' }, descripcion: { type: 'string' } },
      lineas: { asientoId: { type: 'string' }, cuentaId: { type: 'string' }, debe: { type: 'number' }, haber: { type: 'number' } },
      ventas: { fecha: { type: 'string' }, rif: { type: 'string' }, numeroFactura: { type: 'string' }, baseImponible: { type: 'number' }, iva: { type: 'number' }, total: { type: 'number' } },
      compras: { fecha: { type: 'string' }, rif: { type: 'string' }, numeroFactura: { type: 'string' }, baseImponible: { type: 'number' }, iva: { type: 'number' }, total: { type: 'number' } },
      clientes: { nombre: { type: 'string' }, rif: { type: 'string' }, telefono: { type: 'string' }, direccion: { type: 'string' } },
      proveedores: { nombre: { type: 'string' }, rif: { type: 'string' }, telefono: { type: 'string' }, direccion: { type: 'string' } },
      productos: { codigo: { type: 'string' }, nombre: { type: 'string' }, costo: { type: 'number' }, precio: { type: 'number' }, stock: { type: 'number' } },
      empleados: { nombre: { type: 'string' }, cedula: { type: 'string' }, cargo: { type: 'string' }, sueldoBase: { type: 'number' } },
      nominas: { empleadoId: { type: 'string' }, fecha: { type: 'string' }, sueldo: { type: 'number' }, cestaticket: { type: 'number' }, deducciones: { type: 'number' }, neto: { type: 'number' } },
    })
  );

  useCreatePersister(store, (s) => createLocalPersister(s, `mi-profit/${empresa}`), [empresa], async (p) => {
    await p.startAutoLoad();
    await p.startAutoSave();
  });

  useCreatePersister(store, (s: any) => createWsSynchronizer(s, new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/mi-profit-sync')), [], async (synchronizer: any) => {
    await synchronizer.startSync();
  });
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      <Sidebar 
        empresa={empresa} 
        pestanaActiva={pestana} 
        onCambiarPestana={setPestana} 
        onLogout={onLogout} 
      />
      
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {pestana === 'catalogo' && <Catalogo store={store} />}
        {pestana === 'asientos' && <Asientos store={store} irAlLibro={() => setPestana('libro')} />}
        {pestana === 'ventas' && <Ventas store={store} irAlibroFiscal={() => setPestana('libroFiscal')} />}
        {pestana === 'compras' && <Compras store={store} irAlibroCompras={() => setPestana('libroCompras')} />}
        {pestana === 'tesoreria' && <Tesoreria store={store} />}
        {pestana === 'registros' && <Registros store={store} />}
        {pestana === 'empleados' && <Empleados store={store} />}
        {pestana === 'nomina' && <Nomina store={store} irAlLibro={() => setPestana('libro')} />}
        {pestana === 'reportes' && <Reportes store={store} />}
        {pestana === 'libro' && <LibroDiario store={store} />}
        {(pestana === 'libroFiscal' || pestana === 'libroCompras') && <LibrosFiscales store={store} />}
      </div>
    </div>
  );
};

export { App };