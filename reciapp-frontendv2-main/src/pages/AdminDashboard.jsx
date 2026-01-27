import { useEffect, useState } from "react";
import api from "../utils/fetchClient";
// 📊 Importamos Recharts para las visualizaciones de impacto
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  Users, Download, Sparkles, Search, FileSpreadsheet, 
  BrainCircuit, TrendingUp, ShieldCheck, PieChart as PieIcon,
  BarChart3, Activity, ArrowUpRight, Trophy
} from "lucide-react";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("ciudadano");
  const [busqueda, setBusqueda] = useState("");

  // 📈 DATOS SIMULADOS PARA GRÁFICOS (Inversionistas)
  const dataCrecimiento = [
    { name: 'Lun', kg: 450 }, { name: 'Mar', kg: 600 },
    { name: 'Mie', kg: 550 }, { name: 'Jue', kg: 900 },
    { name: 'Vie', kg: 1200 }, { name: 'Sab', kg: 1500 },
    { name: 'Dom', kg: 1100 },
  ];

  const dataMateriales = [
    { name: 'Plástico', value: 45, color: '#10b981' },
    { name: 'Papel', value: 25, color: '#3b82f6' },
    { name: 'Vidrio', value: 20, color: '#f59e0b' },
    { name: 'Metal', value: 10, color: '#ef4444' },
  ];

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/admin/usuarios?rol=${filtroRol}`);
        setUsuarios(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, [filtroRol]);

  const q = busqueda.toLowerCase().trim();
  const usuariosFiltrados = usuarios.filter((u) => {
    const nombre = (u.nombre ?? "").toLowerCase();
    const correo = (u.correo ?? "").toLowerCase();
    return nombre.includes(q) || correo.includes(q);
  });

  return (
    <div className="p-4 lg:p-10 bg-[#F4F7F6] min-h-screen font-sans selection:bg-emerald-100">
      {/* 🟢 CONTENEDOR ANCHO COMPLETO PARA INVERSIONISTAS */}
      <div className="max-w-[1700px] mx-auto">
        
        {/* 🟢 HEADER CORPORATIVO */}
        <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Admin Control</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Intelligence Dashboard</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Reci<span className="text-emerald-500 italic font-black">YAP!</span> <span className="font-light">Console</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* BOTÓN EXPORTAR A EXCEL (Idea planteada) */}
            <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-slate-600 font-bold text-sm border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm group">
              <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform"/>
              Exportar a Excel
            </button>
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Activity size={24} />
            </div>
          </div>
        </header>

        {/* 🟢 SECCIÓN DE GRÁFICOS (EL "WAO" FACTOR) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Gráfico de Tendencia de Recojo (Grande) */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                     <TrendingUp size={16} className="text-emerald-500"/> Tracción de Reciclaje (Kg)
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold mt-1">Crecimiento Orgánico Semanal</p>
               </div>
               <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                  {['Día', 'Mes', 'Año'].map(t => (
                    <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${t === 'Mes' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>{t}</button>
                  ))}
               </div>
            </div>
            
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataCrecimiento}>
                  <defs>
                    <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorKg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Distribución de Materiales */}
          <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-10 flex items-center gap-2">
               <PieIcon size={16} className="text-blue-500"/> Distribución de Residuos
            </h3>
            
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataMateriales} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {dataMateriales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
               {dataMateriales.map((item, i) => (
                 <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.name}</span>
                    </div>
                    <p className="text-sm font-black text-slate-800">{item.value}%</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* 🟢 PANEL DE INTELIGENCIA ARTIFICIAL Y MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
           {/* IA SECTION (Idea planteada) */}
           <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl shadow-slate-300">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                 <BrainCircuit size={220} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">ReciYAP! Predictive Engine</span>
                 </div>
                 <h4 className="text-2xl font-bold mb-2">Simulación de Impacto 2026</h4>
                 <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">Nuestra IA proyecta un ahorro de 12.5 toneladas de CO2 para el próximo trimestre. ¿Deseas ejecutar pruebas con la base de datos actual?</p>
                 <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all w-fit shadow-lg shadow-emerald-900/40">
                    Iniciar Pruebas con IA
                 </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Eficiencia Operativa</p>
              <div className="flex items-center justify-center gap-3">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                 <p className="text-5xl font-black text-slate-800 uppercase tracking-tighter">98%</p>
              </div>
              <p className="text-xs font-bold text-emerald-500 mt-2">Recojos Exitosos</p>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Status de Servidor</p>
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <ShieldCheck size={40} />
              </div>
              <p className="font-black text-emerald-600 mt-2 uppercase text-xs">Protegido & Live</p>
           </div>
        </div>

        {/* 🟢 GESTIÓN DE USUARIOS (TABLA PROFESIONAL) */}
        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto">
                <button onClick={() => setFiltroRol("ciudadano")} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRol === 'ciudadano' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Ciudadanos</button>
                <button onClick={() => setFiltroRol("reciclador")} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRol === 'reciclador' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Recicladores</button>
             </div>
             
             <div className="relative flex-1 max-w-2xl group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20}/>
                <input 
                  type="text" placeholder="Buscar socio por nombre, correo o ID..." 
                  className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all font-medium text-sm shadow-inner"
                  value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                />
             </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                 <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accediendo a la red...</p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-12 py-6 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Identidad</th>
                    <th className="px-12 py-6 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Punto de Contacto</th>
                    <th className="px-12 py-6 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] text-center">Estado de Cuenta</th>
                    <th className="px-12 py-6 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] text-right">Acciones Centrales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-12 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform">{u.nombre?.[0]}</div>
                        <div>
                          <p className="font-black text-slate-800 text-base">{u.nombre}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Socio Certificado</p>
                        </div>
                      </td>
                      <td className="px-12 py-6 text-sm text-slate-500 font-medium italic">{u.correo}</td>
                      <td className="px-12 py-6 text-center">
                         <span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Activo</span>
                      </td>
                      <td className="px-12 py-6 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="px-5 py-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all">Detalles</button>
                            <button className="px-5 py-2 bg-white text-red-400 border border-red-50 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all">Banear</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">ReciYAP! Central Command — Sustainability Intelligence v2.6</p>
      </footer>
    </div>
  );
}