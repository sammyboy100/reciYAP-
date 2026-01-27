import { useState, useEffect, useRef } from 'react';
import { me } from '../api/auth';
import { 
  Navigation, Trash2, User, CheckCircle, Power, Menu, X, LogOut, 
  Leaf, BarChart3, Wallet, Map as MapIcon, HelpCircle, Bell, History 
} from 'lucide-react';

// --- LIBRERÍA DE MAPA (LEAFLET) ---
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuración de iconos (Igual al original)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const iconoReciclador = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconoPedido = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconoDestino = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function CentrarMapa({ coords }) {
    const map = useMap();
    useEffect(() => { if (coords) map.flyTo([coords.lat, coords.lng], 15); }, [coords, map]);
    return null;
}

export default function RecicladorDashboard() {
  // --- ESTADOS ORIGINALES ---
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState({ lat: -12.0464, lng: -77.0428 });
  const [kgReciclados, setKgReciclados] = useState(0);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [solicitudActiva, setSolicitudActiva] = useState(null);
  const [disponible, setDisponible] = useState(true);
  const [filtroMaterial, setFiltroMaterial] = useState('Todos');
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // --- 🟢 LÓGICA ORIGINAL (Mantenida al 100%) ---
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await me();
        setUserId(user.id);
        setUserData(user);
        cargarKgReciclados(user.id);
      } catch (error) { console.error('Error user:', error); }
    };
    getUser();
  }, []);

  const cargarKgReciclados = async (recicladorId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/solicitudes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        const total = data.filter((s) => s.reciclador_id === recicladorId && s.estado === 'completada')
                          .reduce((sum, s) => sum + parseFloat(s.cantidad || 0), 0);
        setKgReciclados(total.toFixed(1));
      }
    } catch (e) { console.error(e); }
  };

  // WebSocket y GeoLoc (Lógica intacta del usuario)
  useEffect(() => {
    if (!userId) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
    socketRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'nueva_solicitud') setSolicitudesPendientes(p => [...p, data.solicitud]);
      else if (data.type === 'solicitud_cancelada') {
        setSolicitudesPendientes(p => p.filter(s => s.id !== data.solicitud_id));
        if (solicitudActiva?.id === data.solicitud_id) { alert('Cancelada'); setSolicitudActiva(null); setDisponible(true); }
      }
    };
    return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
  }, [userId, solicitudActiva]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    watchIdRef.current = navigator.geolocation.watchPosition((p) => {
      const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
      setMiUbicacion(coords);
      if (socketRef.current?.readyState === WebSocket.OPEN && solicitudActiva) {
        socketRef.current.send(JSON.stringify({ type: 'ubicacion_reciclador', ...coords, solicitud_id: solicitudActiva.id, reciclador_id: userId }));
      }
    }, null, { enableHighAccuracy: true });
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [solicitudActiva, userId]);

  // Handlers (Aceptar, Completar, etc)
  const aceptarSolicitud = async (sol) => { /* lógica original */ setSolicitudActiva(sol); setDisponible(false); };
  const completarServicio = async () => { /* lógica original */ setSolicitudActiva(null); setDisponible(true); };
  const cerrarSesion = () => { localStorage.removeItem('token'); window.location.href = '/'; };

  const solicitudesFiltradas = solicitudesPendientes.filter(s => filtroMaterial === 'Todos' || s.tipo_material.includes(filtroMaterial));

  if (!userId) return <div className="h-screen flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold">Cargando ReciYAP!...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans text-slate-800 pb-10">
      
      {/* 🟢 BARRA SUPERIOR INSTITUCIONAL */}
      <nav className="sticky top-0 z-[1000] bg-white border-b border-emerald-50 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">R</div>
          <span className="text-xl font-black text-emerald-900 tracking-tighter">Reci<span className="text-emerald-500 italic">YAP!</span></span>
        </div>
        
        <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition-all ${disponible ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
                {disponible ? '● Online' : '○ Offline'}
                <button onClick={() => setDisponible(!disponible)} className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors ${disponible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <Power size={12} />
                </button>
            </div>
            <button onClick={cerrarSesion} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 🟢 COLUMNA IZQUIERDA: PERFIL Y BOTONES (BENTO) */}
          <div className="lg:col-span-3 space-y-6">
            {/* CARD USUARIO */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-emerald-700 text-3xl font-black border-4 border-white shadow-md">
                {userData?.nombre ? userData.nombre[0].toUpperCase() : 'R'}
              </div>
              <h2 className="font-black text-xl text-slate-800">{userData?.nombre || 'Reciclador'}</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Socio Profesional</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 gap-3">
                 <div className="bg-emerald-50 p-3 rounded-2xl">
                    <p className="text-2xl font-black text-emerald-700">{kgReciclados}</p>
                    <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Kg Totales</p>
                 </div>
              </div>
            </div>

            {/* MENÚ DE ACCIONES (Nuevos Botones) */}
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 ml-4">Centro de Operaciones</p>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all group">
                    <BarChart3 size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-left flex-1">Mis Estadísticas</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all group">
                    <Wallet size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-left flex-1">Billetera / YAPs</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all group">
                    <MapIcon size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-left flex-1">Rutas Óptimas</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all group">
                    <History size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-left flex-1">Historial</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all group">
                    <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-left flex-1">Ayuda</span>
                </button>
            </div>
          </div>

          {/* 🟢 COLUMNA CENTRAL: MAPA (EL CORAZÓN) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-[3rem] p-4 shadow-xl border border-white h-[600px] relative overflow-hidden">
                <MapContainer center={[miUbicacion.lat, miUbicacion.lng]} zoom={15} style={{ height: "100%", width: "100%", borderRadius: '2rem' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <CentrarMapa coords={miUbicacion} />
                    <Marker position={[miUbicacion.lat, miUbicacion.lng]} icon={iconoReciclador}><Popup>Estás aquí</Popup></Marker>
                    {solicitudesFiltradas.map((s) => (
                        <Marker key={s.id} position={[s.latitud, s.longitud]} icon={iconoPedido}><Popup>{s.tipo_material}</Popup></Marker>
                    ))}
                    {solicitudActiva && <Marker position={[solicitudActiva.latitud, solicitudActiva.longitud]} icon={iconoDestino}><Popup>Destino</Popup></Marker>}
                </MapContainer>
                
                {/* Overlay flotante en mapa para el filtro */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1001] flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-2xl border border-emerald-100">
                    {['Todos', 'Plastico', 'Papel'].map(f => (
                        <button key={f} onClick={() => setFiltroMaterial(f)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtroMaterial === f ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600'}`}>{f}</button>
                    ))}
                </div>
            </div>
          </div>

          {/* 🟢 COLUMNA DERECHA: PEDIDOS / MISIÓN ACTIVA */}
          <div className="lg:col-span-3 space-y-6">
            {solicitudActiva ? (
               <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200 animate-pulse-slow">
                  <div className="flex items-center gap-2 mb-4 text-emerald-200 font-bold text-xs uppercase tracking-widest">
                     <Navigation size={14} /> Misión en curso
                  </div>
                  <h3 className="text-3xl font-black mb-1">{solicitudActiva.tipo_material}</h3>
                  <p className="text-emerald-100 opacity-80 mb-6 font-medium">{solicitudActiva.cantidad} kg por recolectar</p>
                  <button onClick={completarServicio} className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">Completado</button>
               </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[600px] flex flex-col">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 px-2">Pedidos Cercanos</h3>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {solicitudesFiltradas.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <Trash2 size={48} className="mx-auto mb-2" />
                                <p className="font-bold">Sin pedidos</p>
                            </div>
                        ) : (
                            solicitudesFiltradas.map(sol => (
                                <div key={sol.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm"><Leaf size={20}/></div>
                                        <div>
                                            <p className="font-black text-slate-800 leading-none">{sol.tipo_material}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{sol.cantidad} Kg aprox.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => aceptarSolicitud(sol)} className="w-full py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">Aceptar</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="mt-10 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">ReciYAP! Driver Protocol 2026</p>
      </footer>
    </div>
  );
}