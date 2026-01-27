import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "../api/auth";
import ReciScanner from "./ReciScanner";

import { 
  ArrowLeft, MapPin, Save, Leaf, Plus, Trash2, 
  Sparkles, Calculator, Coins, Trophy, History, Star, Quote,
  TrendingUp, Award, Zap
} from "lucide-react";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Precios y Opciones (Manteniendo lógica)
const PRECIOS_MATERIAL = { Plastico: 1.20, Carton: 0.50, Vidrio: 0.20, Metal: 3.50, Papel: 0.80, Organico: 0.15 };
const MATERIALES_OPCIONES = [
  { value: "Plastico", label: "Plástico (S/ 1.20/kg)" },
  { value: "Carton", label: "Cartón (S/ 0.50/kg)" },
  { value: "Vidrio", label: "Vidrio (S/ 0.20/kg)" },
  { value: "Metal", label: "Fierro/Metal (S/ 3.50/kg)" },
  { value: "Papel", label: "Papel (S/ 0.80/kg)" },
  { value: "Organico", label: "Orgánico (S/ 0.15/kg)" },
];

const FRASES_MOTIVADORAS = [
    "No es solo basura, es el futuro de nuestro planeta. 🌍",
    "Cada botella cuenta. ¡Tú eres el cambio! ✨",
    "Reciclar es darle una segunda oportunidad a la vida. 🌱",
    "Tus acciones de hoy serán el oxígeno de mañana. 🍃",
    "¡Increíble! Estás a poco de subir al siguiente nivel Eco-VIP. 🏆"
  ];

function LocationMarker({ setPosicion }) {
  const map = useMapEvents({
    click(e) { setPosicion(e.latlng); map.flyTo(e.latlng, map.getZoom()); },
  });
  return null;
}

export default function CiudadanoDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [frase, setFrase] = useState("");
  
  const [formData, setFormData] = useState({
    materiales: [{ tipo_material: "Plastico", cantidad: "" }],
    descripcion: "",
  });
  const [posicion, setPosicion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await me();
        setUser(userData);
        setHistorial([
          { id: 1, fecha: "Hoy", material: "Plástico", kg: "5.4", puntos: "64.8", estado: "Pendiente" },
          { id: 2, fecha: "12 Ene", material: "Vidrio", kg: "10.0", puntos: "20.0", estado: "Completado" },
          { id: 3, fecha: "10 Ene", material: "Papel", kg: "8.5", puntos: "68.0", estado: "Completado" },
        ]);
        setFrase(FRASES_MOTIVADORAS[Math.floor(Math.random() * FRASES_MOTIVADORAS.length)]);
      } catch (err) { console.error(err); }
    };
    fetchData();
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const calcularEstimado = () => {
    return formData.materiales.reduce((total, item) => {
      const precio = PRECIOS_MATERIAL[item.tipo_material] || 0;
      return total + (precio * (parseFloat(item.cantidad) || 0));
    }, 0).toFixed(2);
  };

  const updateMaterialRow = (idx, f, v) => setFormData(p => ({ ...p, materiales: p.materiales.map((m, i) => i === idx ? { ...m, [f]: v } : m) }));

  return (
    <div className="min-h-screen bg-[#F4F7F5] font-sans text-slate-900 selection:bg-emerald-100">
      
      {/* TOP BAR FULL WIDTH */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-50 px-4 lg:px-10 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
           <h1 className="text-xl font-black text-emerald-900 tracking-tighter">Reci<span className="text-emerald-500">YAP!</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm shadow-amber-100/50">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Socio VIP Oro</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{user?.nombre || 'Cargando...'}</p>
                 <p className="text-xs font-black text-emerald-600">ID: #40291</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-black text-emerald-600">
                 {user?.nombre?.[0] || 'U'}
              </div>
           </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1600px] mx-auto p-4 lg:p-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🟢 COLUMNA IZQUIERDA (COL-3) */}
          <div className="lg:col-span-3 space-y-6">
             
             {/* 🔥 FRASE MOTIVADORA MEJORADA (ESTE ES EL CAMBIO CLAVE) 🔥 */}
             <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-emerald-200/40 isolate">
                {/* Foco de luz decorativo */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl -z-10"></div>
                {/* Icono de comillas grande y brillante */}
                <Quote className="absolute -right-4 -bottom-4 w-32 h-32 text-white/20 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
                
                <div className="relative z-10">
                   <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md">🌱 Inspiración Diaria</span>
                   <h3 className="text-2xl md:text-3xl font-serif italic leading-tight mb-6 drop-shadow-sm">"{frase}"</h3>
                   
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><Sparkles size={18} className="text-white"/></div>
                      <div>
                         <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Impacto Real:</p>
                         <p className="text-white text-sm font-medium">1 tonelada de papel = 17 árboles salvados. 🌳</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Tarjetas de Nivel */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Progreso de Impacto</p>
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-2xl font-black text-slate-800">45.0 kg</span>
                      <span className="text-xs font-bold text-emerald-500">Nivel 4</span>
                   </div>
                   <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[65%] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse-slow"></div>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Faltan 15kg para el rango **Eco-Héroe VIP**</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-emerald-50 transition-colors group">
                      <TrendingUp size={18} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-lg font-black text-slate-800">+12%</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Este mes</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-amber-50 transition-colors group">
                      <Award size={18} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-lg font-black text-slate-800">12</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Insignias</p>
                   </div>
                </div>
             </div>
          </div>

          {/* 🟢 COLUMNA CENTRAL (COL-6) */}
          <div className="lg:col-span-6 space-y-6">
             <div className="bg-white rounded-[3rem] p-8 lg:p-12 border border-slate-100 shadow-sm relative">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm"><Zap fill="currentColor"/></div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Nueva <span className="text-emerald-500">Solicitud</span></h2>
                      <p className="text-slate-400 font-medium">Gestión inteligente de residuos</p>
                   </div>
                </div>

                <form className="space-y-10">
                   {/* Scanner integrado */}
                   <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between gap-6 group cursor-pointer hover:bg-black transition-colors shadow-xl shadow-slate-200">
                      <div className="space-y-1">
                         <p className="font-black text-emerald-400 flex items-center gap-2 text-sm"><Sparkles size={16}/> AUTO-IDENTIFICADOR IA</p>
                         <p className="text-xs text-slate-400 font-medium">Usa la cámara para detectar materiales al instante.</p>
                      </div>
                      <div className="w-40 bg-white/10 rounded-xl p-1 backdrop-blur-md"><ReciScanner onAnalysisComplete={() => {}} /></div>
                   </div>

                   {/* Listado de Materiales */}
                   <div className="space-y-4">
                      {formData.materiales.map((mat, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 animate-slide-up">
                           <select 
                             className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow shadow-sm hover:shadow-md"
                             value={mat.tipo_material} onChange={(e) => updateMaterialRow(idx, "tipo_material", e.target.value)}
                           >
                              {MATERIALES_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                           </select>
                           <div className="flex gap-2">
                              <input 
                                type="number" placeholder="Kg" className="w-full md:w-32 bg-slate-50 p-4 rounded-2xl border-none font-black text-center text-emerald-600 text-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow shadow-sm hover:shadow-md"
                                value={mat.cantidad} onChange={(e) => updateMaterialRow(idx, "cantidad", e.target.value)}
                              />
                              <button className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2/></button>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => setFormData(p => ({...p, materiales: [...p.materiales, {tipo_material:"Plastico", cantidad:""}]}))} type="button" className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline pt-2 pl-2">
                         <Plus size={16} /> Añadir otro material
                      </button>
                   </div>

                   {/* Mapa */}
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-2"><MapPin size={14}/> Ubicación del Recojo</p>
                      <div className="h-72 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner relative group">
                         <div className="absolute inset-0 border-4 border-emerald-500/0 group-hover:border-emerald-500/20 transition-all z-10 pointer-events-none rounded-[2.3rem]"></div>
                         <MapContainer center={posicion ? [posicion.lat, posicion.lng] : [-12.04, -77.04]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {posicion && <><LocationMarker setPosicion={setPosicion} /><Marker position={[posicion.lat, posicion.lng]} /></>}
                         </MapContainer>
                      </div>
                   </div>

                   <button className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.01] transition-all uppercase tracking-[0.1em] relative overflow-hidden group">
                      <span className="relative z-10 flex items-center justify-center gap-3"><Save size={22}/> Solicitar Recolector Ahora</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   </button>
                </form>
             </div>
          </div>

          {/* 🟢 COLUMNA DERECHA (COL-3) */}
          <div className="lg:col-span-3 space-y-6">
             {/* Calculadora Flotante */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-500/10 sticky top-28 group hover:shadow-emerald-500/20 transition-shadow">
                <div className="flex items-center gap-2 text-emerald-600 mb-8">
                   <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors"><Calculator size={18} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Calculadora ReciYAP!</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">Recibirás aproximadamente:</p>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className="text-5xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors">S/ {calcularEstimado()}</span>
                </div>
                <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                   <Coins className="text-emerald-600" />
                   <p className="text-[11px] text-emerald-800 font-bold leading-tight uppercase">Equivale a {Math.round(calcularEstimado() * 10)} PV</p>
                </div>
             </div>

             {/* Historial */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div className="flex items-center gap-2 text-slate-400">
                      <History size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Mi Historial</span>
                   </div>
                </div>
                <div className="space-y-4 relative z-10">
                   {historial.map(item => (
                     <div key={item.id} className="flex items-center justify-between p-3 -mx-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group/item">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-100 group-hover/item:text-emerald-600 transition-colors shadow-sm">
                              <Leaf size={16}/>
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800">{item.material}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{item.fecha}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-emerald-600">+{item.points} PV</p>
                           <p className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.estado === 'Pendiente' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>{item.estado}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <button className="w-full mt-8 py-3 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all relative z-10">Ver Actividad Completa</button>
                {/* Decoración de fondo sutil */}
                <Leaf className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50 z-0 rotate-12"/>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}