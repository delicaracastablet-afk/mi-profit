import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';

export const Transferencias = ({ store }: { store: any }) => {
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const almacenesIds = useRowIds('almacenes', store);
  const productosIds = useRowIds('productos', store);

  const procesarTransferencia = () => {
    if (!origenId || !destinoId || !productoId || cantidad <= 0) return alert("Complete todos los datos.");
    if (origenId === destinoId) return alert("El origen y destino no pueden ser iguales.");

    const stockOrigen = Number(store.getCell('productos', productoId, 'stock')); // NOTA: Aquí deberíamos tener stock por almacén, pero usaremos el global por ahora
    if (cantidad > stockOrigen) return alert("No hay suficiente stock en el almacén de origen.");

    // Registrar la transferencia (en un sistema real se descuenta de un lado y se suma al otro)
    // Como estamos usando stock global, solo dejamos constancia del movimiento.
    
    store.addRow('transferencias', {
      fecha: new Date().toISOString().split('T')[0],
      origen: store.getCell('almacenes', origenId, 'nombre'),
      destino: store.getCell('almacenes', destinoId, 'nombre'),
      producto: store.getCell('productos', productoId, 'nombre'),
      cantidad
    });

    alert("Transferencia registrada. (Nota: El stock global se mantiene igual, en un sistema multi-almacén real se restaría del origen y sumaría al destino).");
    setCantidad(1); setProductoId('');
  };

  return (
    <div>
      <h2>Transferencias entre Almacenes</h2>
      <div style={{ backgroundColor: '#2a2a2a', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Almacén Origen</label>
            <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Seleccione...</option>
              {almacenesIds.map((id: string) => <option key={id} value={id}>{store.getCell('almacenes', id, 'nombre')}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Almacén Destino</label>
            <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Seleccione...</option>
              {almacenesIds.map((id: string) => <option key={id} value={id}>{store.getCell('almacenes', id, 'nombre')}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Producto</label>
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
              <option value="">Seleccione...</option>
              {productosIds.map((id: string) => <option key={id} value={id}>{store.getCell('productos', id, 'nombre')}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Cantidad</label>
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }} />
          </div>
        </div>

        <button onClick={procesarTransferencia} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}>
          Realizar Transferencia
        </button>
      </div>
    </div>
  );
};