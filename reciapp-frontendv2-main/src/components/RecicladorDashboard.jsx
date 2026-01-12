import { useState, useEffect, useRef } from 'react';
import { me } from '../api/auth';
import { 
  Navigation, 
  Trash2, 
  User, 
  CheckCircle, 
  Power,
  Menu,
  X,
  LogOut,
  Leaf
} from 'lucide-react';

// --- LIBRERÍA DE MAPA GRATIS (LEAFLET) ---
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para que se vean los íconos en React Leaflet correctamente
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- DEFINICIÓN DE ÍCONOS ---
const iconoReciclador = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconoPedido = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconoDestino = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Componente para centrar el mapa automáticamente al moverse
function CentrarMapa({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo([coords.lat, coords.lng], 15);
        }
    }, [coords, map]);
    return null;
}

export default function RecicladorDashboard() {
  // --- ESTADOS ---
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Ubicación por defecto (Lima) si no hay GPS
  const [miUbicacion, setMiUbicacion] = useState({ lat: -12.0464, lng: -77.0428 });
  
  const [kgReciclados, setKgReciclados] = useState(0);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [solicitudActiva, setSolicitudActiva] = useState(null);
  const [disponible, setDisponible] = useState(true);
  
  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtroMaterial, setFiltroMaterial] = useState('Todos');

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // --- 1. AUTENTICACIÓN Y CARGA USUARIO ---
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await me();
        setUserId(user.id);
        setUserData(user);
        cargarKgReciclados(user.id);
      } catch (error) {
        console.error('Error user:', error);
      }
    };
    getUser();
  }, []);

  const cargarKgReciclados = async (recicladorId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const solicitudesRes = await fetch(`${apiUrl}/api/solicitudes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (solicitudesRes.ok) {
        const solicitudes = await solicitudesRes.json();
        const totalKg = solicitudes
          .filter((s) => s.reciclador_id === recicladorId && s.estado === 'completada')
          .reduce((sum, s) => sum + parseFloat(s.cantidad || 0), 0);
        
        setKgReciclados(totalKg.toFixed(1));
      }
    } catch (error) {
      console.error('Error cargando kg:', error);
    }
  };

  // --- 2. WEBSOCKET ---
  useEffect(() => {
    if (!userId) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'nueva_solicitud') {
        setSolicitudesPendientes((prev) => {
          if (prev.some(s => s.id === data.solicitud.id)) return prev;
          return [...prev, data.solicitud];
        });
      } else if (data.type === 'solicitud_cancelada') {
        setSolicitudesPendientes((prev) => prev.filter(s => s.id !== data.solicitud_id));
        if (solicitudActiva?.id === data.solicitud_id) {
          alert('El ciudadano ha cancelado la solicitud');
          setSolicitudActiva(null);
          setDisponible(true);
        }
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [userId, solicitudActiva]);

  // --- 3. GEOLOCALIZACIÓN ---
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition((pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    // Seguir posición
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nuevaUbicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMiUbicacion(nuevaUbicacion);

        if (socketRef.current?.readyState === WebSocket.OPEN && solicitudActiva) {
          socketRef.current.send(JSON.stringify({
            type: 'ubicacion_reciclador',
            lat: nuevaUbicacion.lat,
            lng: nuevaUbicacion.lng,
            solicitud_id: solicitudActiva.id,
            reciclador_id: userId,
          }));
        }
      },
      (error) => console.error('Error GPS:', error),
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [solicitudActiva, userId]);

  // --- 4. CARGA SOLICITUDES ---
  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/solicitudes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSolicitudesPendientes(data.filter((s) => s.estado === 'pendiente'));
        }
      } catch (error) {
        console.error('Error fetch solicitudes:', error);
      }
    };
    if (userId) cargarSolicitudes();
  }, [userId]);

  // --- FUNCIONES ---
  const cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; 
  };

  const ignorarSolicitud = (id) => {
    setSolicitudesPendientes((prev) => prev.filter((s) => s.id !== id));
  };

  const aceptarSolicitud = async (solicitud) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/solicitudes/${solicitud.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ estado: 'aceptada', reciclador_id: userId }),
      });

      if (!response.ok) throw new Error('Error al aceptar');

      setSolicitudActiva(solicitud);
      setSolicitudesPendientes((prev) => prev.filter((s) => s.id !== solicitud.id));
      setDisponible(false);
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'aceptar_solicitud', solicitud_id: solicitud.id }));
      }
    } catch (error) {
      alert('No se pudo aceptar la solicitud.');
    }
  };

  const completarServicio = async () => {
    if (!solicitudActiva) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/solicitudes/${solicitudActiva.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ estado: 'completada' }),
      });

      if (!response.ok) throw new Error('Error al completar');

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'completar_solicitud', solicitud_id: solicitudActiva.id }));
      }

      const cantidadReciclada = parseFloat(solicitudActiva.cantidad || 0);
      setKgReciclados((prev) => (parseFloat(prev) + cantidadReciclada).toFixed(1));

      alert(`¡Excelente trabajo! +${cantidadReciclada} kg reciclados 🌟`);
      setSolicitudActiva(null);
      setDisponible(true);
    } catch (error) {
      alert('Error al completar el servicio');
    }
  };

  const solicitudesFiltradas = solicitudesPendientes.filter(s => {
    if (filtroMaterial === 'Todos') return true;
    return s.tipo_material.toLowerCase().includes(filtroMaterial.toLowerCase());
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando ReciApp...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-100 font-sans">
      
      {/* ================= MAPA GRATIS (LEAFLET) ================= */}
      <div className="absolute inset-0 z-0">
          <MapContainer 
            center={[miUbicacion.lat, miUbicacion.lng]} 
            zoom={15} 
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            {/* Capa de OpenStreetMap (GRATIS) */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Centrar mapa al moverse */}
            <CentrarMapa coords={miUbicacion} />

            {/* Marcador del Reciclador (TÚ) */}
            <Marker position={[miUbicacion.lat, miUbicacion.lng]} icon={iconoReciclador}>
                <Popup>¡Estás aquí!</Popup>
            </Marker>

            {/* Marcadores de solicitudes pendientes (AZULES) */}
            {!solicitudActiva && solicitudesFiltradas.map((solicitud) => (
                  solicitud.latitud && solicitud.longitud ? (
                     <Marker 
                        key={solicitud.id}
                        position={[parseFloat(solicitud.latitud), parseFloat(solicitud.longitud)]}
                        icon={iconoPedido}
                     >
                        <Popup>
                            <strong>{solicitud.tipo_material}</strong><br/>
                            {solicitud.cantidad} kg
                        </Popup>
                     </Marker>
                  ) : null
            ))}

            {/* Marcador de Destino Activo (ROJO) */}
            {solicitudActiva && solicitudActiva.latitud && (
                <Marker 
                    position={[parseFloat(solicitudActiva.latitud), parseFloat(solicitudActiva.longitud)]}
                    icon={iconoDestino}
                >
                    <Popup>Recoger aquí</Popup>
                </Marker>
            )}

          </MapContainer>
      </div>

      {/* ================= UI FLOTANTE ================= */}
      
      {/* Botón Menu Móvil */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-xl shadow-lg md:hidden text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {sidebarOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* Panel Lateral (Sidebar) */}
      <div className={`absolute top-0 left-0 h-full w-full md:w-96 bg-white/95 backdrop-blur-md shadow-2xl z-[1001] transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header del Sidebar */}
          <div className="p-6 bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md relative">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 md:hidden opacity-80 hover:opacity-100">
               <X size={24}/>
            </button>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white text-green-600 flex items-center justify-center font-bold text-2xl shadow-inner border-2 border-green-200">
                {userData?.nombre ? userData.nombre[0].toUpperCase() : <User />}
              </div>
              <div>
                <h2 className="font-bold text-xl">{userData?.nombre || 'Reciclador'}</h2>
                <div className="flex items-center gap-1 text-green-100 text-sm">
                  <span className="font-medium">Reciclador Profesional</span>
                </div>
              </div>
            </div>
            
            {/* Stats Rápidas */}
            <div className="flex mt-6 gap-2">
              <div className="flex-1 bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <p className="text-3xl font-bold">{kgReciclados}</p>
                <p className="text-xs uppercase tracking-wider opacity-90">kg Reciclados</p>
              </div>
            </div>
          </div>

          {/* Cuerpo del Sidebar */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            
            {/* MODO MISIÓN */}
            {solicitudActiva ? (
              <div className="bg-white border-2 border-green-500 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl animate-pulse">
                  🚗 EN CAMINO
                </div>
                
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                  <Navigation size={14}/> Destino
                </h3>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{solicitudActiva.tipo_material}</h2>
                <p className="text-gray-500 mb-4">{solicitudActiva.cantidad} kg aprox.</p>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                        🗺️ Sigue el mapa para llegar a la ubicación marcada en <strong>ROJO</strong>.
                    </p>
                </div>

                <button 
                  onClick={completarServicio}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                >
                  <CheckCircle size={20}/> Completar Recolección
                </button>
              </div>
            ) : (
              // MODO LISTA
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['Todos', 'Plastico', 'Carton', 'Vidrio', 'Metal'].map(filtro => (
                      <button
                        key={filtro}
                        onClick={() => setFiltroMaterial(filtro)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                          filtroMaterial === filtro 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {filtro}
                      </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Leaf size={14}/> Disponibles ({solicitudesFiltradas.length})
                  </h3>
                </div>

                <div className="space-y-3 pb-20">
                  {solicitudesFiltradas.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                      <Trash2 size={48} className="mx-auto mb-3 text-gray-400"/>
                      <p className="text-sm font-medium">No hay solicitudes cerca.</p>
                    </div>
                  ) : (
                    solicitudesFiltradas.map((sol) => (
                      <div key={sol.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                        <button 
                           onClick={() => ignorarSolicitud(sol.id)}
                           className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
                           title="Ignorar"
                        >
                           <X size={16}/>
                        </button>

                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                             <Trash2 size={20}/>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-700">{sol.tipo_material}</h4>
                            <p className="text-xs text-gray-400 mb-3">{sol.cantidad} kg • Recolección inmediata</p>
                            
                            <button 
                              onClick={() => aceptarSolicitud(sol)}
                              className="w-full bg-gray-50 hover:bg-green-600 hover:text-white text-gray-600 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Navigation size={14}/> Ir a Recoger
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer del Sidebar (Logout) */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button 
              onClick={cerrarSesion}
              className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 py-3 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Switch de Estado (Top Right) */}
      <div className="absolute top-4 right-4 z-[1000] hidden md:block">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all ${disponible ? 'bg-white/90 border-green-500 border-2' : 'bg-gray-800/90 border-gray-600 border'}`}>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold uppercase ${disponible ? 'text-green-600' : 'text-gray-400'}`}>
              {disponible ? 'En Línea' : 'Offline'}
            </span>
          </div>
          <button 
            onClick={() => setDisponible(!disponible)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${disponible ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-600 text-gray-300'}`}
          >
            <Power size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}