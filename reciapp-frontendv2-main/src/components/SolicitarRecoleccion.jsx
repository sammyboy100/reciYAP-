import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "../api/auth";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Menu,
  X,
  User,
  MapPin,
  Clock,
  Package,
  Leaf,
  ArrowLeft,
  AlertCircle,
  Locate,
  Plus,
  Trash2, // ✅ IMPORTANTE: evita el error Trash2 is not defined
  Camera,
  Image as ImageIcon,
} from "lucide-react";

/** ================== ICONOS LEAFLET ================== */
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const recicladorIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Centrado suave del mapa */
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 15);
  }, [center, map]);
  return null;
}

const MATERIAL_OPTIONS = [
  { value: "plastico", label: "🔵 Plástico" },
  { value: "papel", label: "📄 Papel / Cartón" },
  { value: "vidrio", label: "💎 Vidrio" },
  { value: "metal", label: "⚙️ Metal" },
  { value: "electronico", label: "🔌 Electrónico" },
];

export default function SolicitarRecoleccion() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  const [ubicacion, setUbicacion] = useState(null);
  const [recicladorUbicacion, setRecicladorUbicacion] = useState(null);

  const [solicitudActiva, setSolicitudActiva] = useState(null);
  const [distanciaEstimada, setDistanciaEstimada] = useState(null);
  const [tiempoEstimado, setTiempoEstimado] = useState(null);

  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [kgReciclados, setKgReciclados] = useState(0);
  const [puntosVerdes, setPuntosVerdes] = useState(0);

  const socketRef = useRef(null);

  /** ================== FORMULARIO ================== */
  const [formulario, setFormulario] = useState({
    materiales: [{ tipo_material: "plastico", cantidad: "" }],
    descripcion: "",
    observaciones: "",
    horario_preferido: "",
    empaquetado: "bolsa", // bolsa / caja / suelto
    limpio_seco: true,
    foto: null, // File
  });

  const [fotoPreview, setFotoPreview] = useState(null);

  const totalKgIngresados = useMemo(() => {
    return formulario.materiales.reduce((sum, m) => {
      const v = parseFloat(m.cantidad);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [formulario.materiales]);

  /** ================== DISTANCIA (Haversine) ================== */
  const calcularDistanciaManual = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return;

    const R = 6371;
    const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
    const dLon = (pos2.lng - pos1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(pos1.lat * (Math.PI / 180)) *
        Math.cos(pos2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    setDistanciaEstimada(d.toFixed(2));
    setTiempoEstimado(Math.max(1, Math.round(d * 4))); // aprox 4 min por km
  }, []);

  useEffect(() => {
    if (recicladorUbicacion && ubicacion) {
      calcularDistanciaManual(ubicacion, recicladorUbicacion);
    }
  }, [recicladorUbicacion, ubicacion, calcularDistanciaManual]);

  /** ================== CARGA USUARIO ================== */
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await me();
        setUserId(user.id);
        setUserData(user);
        await cargarDatosUsuario(user.id);
      } catch (e) {
        console.error("Error obteniendo usuario:", e);
      }
    };
    getUser();
  }, []);

  const cargarDatosUsuario = async (usuarioId) => {
    try {
      const solicitudesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/solicitudes`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        const misSolicitudes = data.filter((s) => s.usuario_id === usuarioId);
        const total = misSolicitudes
          .filter((s) => s.estado === "completada")
          .reduce((sum, s) => sum + parseFloat(s.cantidad || 0), 0);
        setKgReciclados(total.toFixed(1));
      }

      const walletRes = await fetch(
        `${import.meta.env.VITE_API_URL}/wallets/${usuarioId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setPuntosVerdes(walletData.puntos || 0);
      }
    } catch (e) {
      console.error("Error cargando datos usuario:", e);
    }
  };

  /** ================== GEOLOCALIZACIÓN ================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      setUbicacion({ lat: -12.0464, lng: -77.0428 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUbicacion({ lat: -12.0464, lng: -77.0428 })
    );
  }, []);

  /** ================== WEBSOCKET ================== */
  useEffect(() => {
    if (!userId) return;

    const api = import.meta.env.VITE_API_URL;
    const wsUrl = api
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
    socketRef.current = ws;

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "solicitud_aceptada") {
        setSolicitudActiva((prev) => ({
          ...prev,
          estado: "aceptada",
          reciclador_id: data.reciclador_id,
        }));
        alert("¡Un reciclador aceptó tu solicitud! Está en camino 🚗");
      }

      if (data.type === "ubicacion_reciclador") {
        setRecicladorUbicacion({ lat: data.lat, lng: data.lng });
      }

      if (data.type === "solicitud_completada") {
        alert("¡Recolección completada! Gracias por reciclar 🌱");
        setSolicitudActiva(null);
        setRecicladorUbicacion(null);
        setDistanciaEstimada(null);
        setTiempoEstimado(null);
        await cargarDatosUsuario(userId);
      }
    };

    ws.onerror = (err) => console.error("WS error:", err);
    ws.onclose = () => console.log("WS cerrado");

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [userId]);

  /** ================== MANEJO MATERIALES ================== */
  const addMaterial = () => {
    setFormulario((prev) => ({
      ...prev,
      materiales: [...prev.materiales, { tipo_material: "plastico", cantidad: "" }],
    }));
  };

  const removeMaterial = (idx) => {
    setFormulario((prev) => {
      if (prev.materiales.length === 1) return prev; // mínimo 1
      const copy = [...prev.materiales];
      copy.splice(idx, 1);
      return { ...prev, materiales: copy };
    });
  };

  const updateMaterial = (idx, field, value) => {
    setFormulario((prev) => {
      const copy = [...prev.materiales];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, materiales: copy };
    });
  };

  /** ================== FOTO OPCIONAL ================== */
  const handleFotoChange = (file) => {
    if (!file) return;

    // validaciones rápidas
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      alert("Solo imágenes JPG/PNG/WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo 5MB.");
      return;
    }

    setFormulario((prev) => ({ ...prev, foto: file }));

    const url = URL.createObjectURL(file);
    setFotoPreview(url);
  };

  const clearFoto = () => {
    setFormulario((prev) => ({ ...prev, foto: null }));
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
  };

  /** ================== VALIDACIÓN ================== */
  const isValid = useMemo(() => {
    // Todas las cantidades deben ser > 0
    const hasInvalid = formulario.materiales.some((m) => {
      const v = parseFloat(m.cantidad);
      return !Number.isFinite(v) || v <= 0;
    });
    return !hasInvalid && totalKgIngresados > 0;
  }, [formulario.materiales, totalKgIngresados]);

  /** ================== ENVIAR ================== */
  const handleSolicitar = async () => {
    if (!ubicacion) return alert("Obteniendo ubicación...");
    if (!isValid) return alert("Revisa cantidades: deben ser mayores a 0.");

    setLoading(true);
    try {
      // ✅ FormData para enviar foto opcional
      const fd = new FormData();

      // Datos principales
      fd.append("latitud", String(ubicacion.lat));
      fd.append("longitud", String(ubicacion.lng));
      fd.append("descripcion", formulario.descripcion || "");
      fd.append("observaciones", formulario.observaciones || "");
      fd.append("horario_preferido", formulario.horario_preferido || "");
      fd.append("empaquetado", formulario.empaquetado || "bolsa");
      fd.append("limpio_seco", String(!!formulario.limpio_seco));

      // Materiales como JSON
      fd.append(
        "materiales",
        JSON.stringify(
          formulario.materiales.map((m) => ({
            tipo_material: m.tipo_material,
            cantidad: parseFloat(m.cantidad),
          }))
        )
      );

      // Foto opcional
      if (formulario.foto) {
        fd.append("foto", formulario.foto);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/solicitudes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // ⚠️ NO pongas Content-Type aquí; fetch lo setea solo para FormData
        },
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Backend:", txt);
        throw new Error("Error al crear solicitud");
      }

      const sol = await res.json();
      setSolicitudActiva(sol);

      // notificar por WS
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "nueva_solicitud", solicitud: sol }));
      }

      alert("¡Solicitud creada! Buscando recicladores cercanos...");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear la solicitud. Revisa backend (multipart/form-data).");
    } finally {
      setLoading(false);
    }
  };

  /** ================== UI ================== */
  if (!userId || !ubicacion) {
    return (
      <div className="h-screen flex items-center justify-center">
        Cargando ReciApp...
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-100">
      {/* ============ MAPA (OSM + Leaflet) ============ */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[ubicacion.lat, ubicacion.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController center={ubicacion} />

          <Marker position={[ubicacion.lat, ubicacion.lng]}>
            <Popup>Tu punto de recojo</Popup>
          </Marker>

          {recicladorUbicacion && (
            <>
              <Marker
                position={[recicladorUbicacion.lat, recicladorUbicacion.lng]}
                icon={recicladorIcon}
              >
                <Popup>Reciclador en camino</Popup>
              </Marker>

              <Polyline
                positions={[
                  [ubicacion.lat, ubicacion.lng],
                  [recicladorUbicacion.lat, recicladorUbicacion.lng],
                ]}
                pathOptions={{ color: "#10b981", dashArray: "10, 10" }}
              />
              <Circle
                center={[ubicacion.lat, ubicacion.lng]}
                radius={100}
                pathOptions={{ color: "#10b981", fillOpacity: 0.1 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* ============ BOTÓN MENÚ (MÓVIL) ============ */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-xl shadow-lg md:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ============ SIDEBAR ============ */}
      <div
        className={`absolute top-0 left-0 h-full w-full md:w-96 bg-white/95 backdrop-blur-md shadow-2xl z-[1001] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-green-600 to-green-500 text-white">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {userData?.nombre?.[0]?.toUpperCase() || <User size={18} />}
              </div>
              <div>
                <h2 className="font-bold text-xl">{userData?.nombre}</h2>
                <div className="text-xs opacity-90 flex items-center gap-1">
                  <Leaf size={14} /> Contribuyente activo
                </div>
              </div>
            </div>

            <div className="flex mt-4 gap-2">
              <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
                <p className="text-xl font-bold">{puntosVerdes}</p>
                <p className="text-[10px] uppercase opacity-80">Puntos</p>
              </div>
              <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
                <p className="text-xl font-bold">{kgReciclados}</p>
                <p className="text-[10px] uppercase opacity-80">kg Total</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {!solicitudActiva ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Package size={18} /> Nueva Recolección
                  </h3>
                  <div className="text-xs text-gray-500">
                    Total: <span className="font-semibold">{totalKgIngresados.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* FOTO OPCIONAL */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Camera size={16} /> Foto (opcional)
                    </p>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={clearFoto}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {fotoPreview ? (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={fotoPreview}
                        alt="preview"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600 hover:bg-gray-50">
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon size={18} />
                          <span>Subir imagen (JPG/PNG/WEBP)</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Máx. 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFotoChange(e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>

                {/* MATERIALES (MULTI) */}
                <div className="space-y-3">
                  {formulario.materiales.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Material {idx + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeMaterial(idx)}
                          className={`p-2 rounded-lg border ${
                            formulario.materiales.length === 1
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-red-50 hover:border-red-200"
                          }`}
                          disabled={formulario.materiales.length === 1}
                          title="Eliminar material"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>

                      <select
                        className="w-full p-2 rounded-lg mb-2 border border-gray-200 focus:ring-2 focus:ring-green-500"
                        value={m.tipo_material}
                        onChange={(e) => updateMaterial(idx, "tipo_material", e.target.value)}
                      >
                        {MATERIAL_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500"
                        placeholder="Cantidad (kg)"
                        value={m.cantidad}
                        onChange={(e) => updateMaterial(idx, "cantidad", e.target.value)}
                      />

                      {m.cantidad && parseFloat(m.cantidad) <= 0 && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> La cantidad debe ser mayor a 0
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addMaterial}
                    className="w-full flex items-center justify-center gap-2 text-green-700 font-semibold py-2 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100"
                  >
                    <Plus size={18} /> Agregar otro material
                  </button>
                </div>

                {/* EXTRAS ÚTILES */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      ¿Material limpio y seco?
                    </p>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!formulario.limpio_seco}
                        onChange={(e) =>
                          setFormulario((prev) => ({ ...prev, limpio_seco: e.target.checked }))
                        }
                      />
                      <span className="text-gray-600">Sí</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Empaque
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500"
                      value={formulario.empaquetado}
                      onChange={(e) =>
                        setFormulario((prev) => ({ ...prev, empaquetado: e.target.value }))
                      }
                    >
                      <option value="bolsa">Bolsa</option>
                      <option value="caja">Caja</option>
                      <option value="suelto">Suelto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Horario preferido (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: 6pm - 8pm / Solo mañanas"
                      value={formulario.horario_preferido}
                      onChange={(e) =>
                        setFormulario((prev) => ({ ...prev, horario_preferido: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* DESCRIPCIÓN / OBSERVACIONES */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 resize-none"
                      rows={2}
                      placeholder="Ej: botellas limpias en bolsa negra..."
                      value={formulario.descripcion}
                      onChange={(e) =>
                        setFormulario((prev) => ({ ...prev, descripcion: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Observaciones para el reciclador (opcional)
                    </label>
                    <textarea
                      className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 resize-none"
                      rows={2}
                      placeholder="Ej: tocar timbre 2 veces, puerta azul, llamar al llegar..."
                      value={formulario.observaciones}
                      onChange={(e) =>
                        setFormulario((prev) => ({ ...prev, observaciones: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSolicitar}
                  disabled={loading || !isValid}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MapPin size={18} />
                  {loading ? "Procesando..." : "Solicitar Recolección"}
                </button>

                {!isValid && (
                  <p className="text-xs text-red-600 text-center">
                    Revisa cantidades: deben ser mayores a 0.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-green-500 rounded-2xl p-5 shadow-lg">
                <p className="text-xs font-bold text-green-600 uppercase mb-2">
                  Solicitud Activa
                </p>
                <h2 className="text-xl font-bold text-gray-800">
                  {solicitudActiva.estado === "pendiente"
                    ? "Buscando reciclador..."
                    : "Reciclador en camino"}
                </h2>

                {distanciaEstimada && (
                  <div className="mt-4 flex gap-4 bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold text-green-700">
                        {tiempoEstimado}
                      </p>
                      <p className="text-[10px] uppercase">min</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold text-green-700">
                        {distanciaEstimada}
                      </p>
                      <p className="text-[10px] uppercase">km</p>
                    </div>
                  </div>
                )}

                {distanciaEstimada && parseFloat(distanciaEstimada) < 1.0 && (
                  <div className="mt-3 bg-yellow-400 text-yellow-900 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold">
                      ¡El reciclador está cerca! Prepara tus materiales.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate("/ciudadano")}
                  className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl mt-4"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => navigate("/ciudadano")}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 py-3 rounded-xl transition-colors font-medium text-sm"
            >
              <ArrowLeft size={18} /> Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
