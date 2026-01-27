import { useEffect, useState } from "react";
import api from "../utils/fetchClient";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

export default function PrecioTicker() {
  const [precios, setPrecios] = useState([]);

  const fetchPrecios = async () => {
    try {
      const res = await api.get("/api/precios");
      // Si el backend devuelve un array, lo usamos. Si no, array vacío para evitar errores.
      setPrecios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar precios IA:", error);
      setPrecios([]); // Fallback seguro
    }
  };

  useEffect(() => {
    fetchPrecios();
    // La IA "recalcula" los precios cada 30 segundos
    const interval = setInterval(fetchPrecios, 30000);
    return () => clearInterval(interval);
  }, []);

  // Si no hay precios, no mostramos la barra para que no se vea vacía
  if (precios.length === 0) return null;

  return (
    // 🟢 CAMBIO 1: Altura (py-4) y Color de fondo (bg-emerald-600) para coincidir con el Navbar
    <div className="bg-emerald-600 text-white py-4 overflow-hidden border-b border-emerald-700 shadow-sm z-40 relative font-sans">
      <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
        {/* Badge de IA */}
        <div className="flex items-center gap-2 px-4 border-r border-emerald-500/50">
          {/* 🟢 CAMBIO 2: Icono y texto en blanco/amarillo para resaltar sobre verde */}
          <Sparkles size={16} className="text-amber-300 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-tighter text-white">
            AI Market Live
          </span>
        </div>

        {/* Mapeo de precios */}
        {precios.map((p, i) => (
          <div key={i} className="flex items-center gap-3 group px-2 py-1 rounded-lg hover:bg-emerald-700/50 transition-all">
            {/* 🟢 CAMBIO 3: Texto del material en un tono verde claro */}
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">
              {p.material}
            </span>
            <span className="font-black tracking-tighter text-sm">
              S/ {p.precio.toFixed(2)}
            </span>
            
            {/* 🟢 CAMBIO 4: Indicadores de tendencia con fondo blanco para máximo contraste */}
            <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full transition-all duration-500 shadow-sm ${
              p.tendencia === 'up' ? 'bg-white text-emerald-700' : 
              p.tendencia === 'down' ? 'bg-white text-red-600' : 
              'bg-white/80 text-slate-600'
            }`}>
              {p.tendencia === 'up' && <TrendingUp size={10} />}
              {p.tendencia === 'down' && <TrendingDown size={10} />}
              {p.tendencia === 'stable' && <Minus size={10} />}
              {p.variacion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}