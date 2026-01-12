import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { me } from '../api/auth';
import Navbar from './Navbar';
import ReciScanner from './ReciScanner';

import { ArrowLeft, MapPin, Save, Leaf, Plus, Trash2 } from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ setPosicion }) {
  const map = useMapEvents({
    click(e) {
      setPosicion(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPosicion(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

const MATERIALES_OPCIONES = [
  { value: 'Plastico', label: 'Plástico' },
  { value: 'Carton', label: 'Cartón' },
  { value: 'Vidrio', label: 'Vidrio' },
  { value: 'Metal', label: 'Metal' },
  { value: 'Papel', label: 'Papel' },
  { value: 'Organico', label: 'Orgánico' },
  { value: 'Otro', label: 'Otro' },
];

export default function SolicitarRecoleccion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ✅ Ahora soporta múltiples materiales
  const [formData, setFormData] = useState({
    materiales: [
      { tipo_material: 'Plastico', cantidad: '' }, // primera fila por defecto
    ],
    descripcion: '',
  });

  const [posicion, setPosicion] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const mapMateriales = {
    'Plastic': 'Plastico',
    'Plástico': 'Plastico',
    'Cardboard': 'Carton',
    'Cartón': 'Carton',
    'Glass': 'Vidrio',
    'Metal': 'Metal',
    'Paper': 'Papel',
    'Papel': 'Papel',
    'Organic': 'Organico',
    'Orgánico': 'Organico',
  };

  // ✅ IA ahora agrega material a la lista si no existe
  const handleMaterialDetectado = (materialIA) => {
    let materialFinal = mapMateriales[materialIA] || materialIA;

    // Si IA te devuelve algo raro, lo mandamos a "Otro"
    const valid = MATERIALES_OPCIONES.some((m) => m.value === materialFinal);
    if (!valid) materialFinal = 'Otro';

    setFormData((prev) => {
      const yaExiste = prev.materiales.some((m) => m.tipo_material === materialFinal);

      // Si ya existe, solo actualiza descripción
      if (yaExiste) {
        return {
          ...prev,
          descripcion: prev.descripcion
            ? prev.descripcion
            : `Detectado automáticamente por IA (${materialIA})`,
        };
      }

      // Si no existe, lo agrega con cantidad vacía
      return {
        ...prev,
        materiales: [...prev.materiales, { tipo_material: materialFinal, cantidad: '' }],
        descripcion: prev.descripcion
          ? prev.descripcion
          : `Detectado automáticamente por IA (${materialIA})`,
      };
    });

    alert(`¡IA Detectó: ${materialFinal}! Material agregado/actualizado.`);
  };

  const addMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materiales: [...prev.materiales, { tipo_material: 'Plastico', cantidad: '' }],
    }));
  };

  const removeMaterialRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      materiales: prev.materiales.filter((_, i) => i !== index),
    }));
  };

  const updateMaterialRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      materiales: prev.materiales.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!posicion) return alert("Por favor selecciona una ubicación en el mapa");

    // Validación mínima: al menos 1 material y cantidades válidas
    if (!formData.materiales.length) return alert("Agrega al menos un material.");

    for (const m of formData.materiales) {
      if (!m.tipo_material) return alert("Selecciona el tipo de material.");
      if (m.cantidad === '' || Number(m.cantidad) <= 0) {
        return alert("Ingresa una cantidad válida (kg) para cada material.");
      }
    }

    setLoading(true);
    try {
      const user = await me();

      // ✅ payload ahora manda "materiales" (array)
      const payload = {
        usuario_id: user.id,
        materiales: formData.materiales.map((m) => ({
          tipo_material: m.tipo_material,
          cantidad: Number(m.cantidad),
        })),
        descripcion: formData.descripcion,
        latitud: posicion.lat,
        longitud: posicion.lng,
        estado: 'pendiente',
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/solicitudes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("✅ Solicitud creada con éxito");
        navigate('/ciudadano-dashboard');
      } else {
        const errText = await response.text().catch(() => '');
        alert("Error al crear solicitud" + (errText ? `: ${errText}` : ''));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Volver al Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-green-600 p-6 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Leaf /> Nueva Recolección
            </h1>
            <p className="opacity-90">Completa los datos para que un reciclador pase por tu casa.</p>
          </div>

          <div className="p-6 space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-2">¿No sabes qué material es?</h3>
              <ReciScanner onAnalysisComplete={handleMaterialDetectado} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ✅ MÚLTIPLES MATERIALES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Materiales y cantidades (kg)
                  </label>

                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Plus size={16} /> Agregar material
                  </button>
                </div>

                {formData.materiales.map((mat, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de material</label>
                      <select
                        required
                        value={mat.tipo_material}
                        onChange={(e) => updateMaterialRow(idx, 'tipo_material', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        {MATERIALES_OPCIONES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad aprox. (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          required
                          placeholder="Ej: 2.5"
                          value={mat.cantidad}
                          onChange={(e) => updateMaterialRow(idx, 'cantidad', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMaterialRow(idx)}
                        disabled={formData.materiales.length === 1}
                        title={formData.materiales.length === 1 ? "Debe haber al menos 1 material" : "Eliminar"}
                        className={`h-[50px] px-3 rounded-lg border flex items-center justify-center
                          ${formData.materiales.length === 1
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (Opcional)</label>
                <textarea
                  rows="2"
                  placeholder="Ej: Botellas limpias en bolsa negra..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* MAPA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-red-500" /> ¿Dónde recogemos? (Toca el mapa)
                </label>
                <div className="h-64 rounded-xl overflow-hidden border-2 border-gray-200 relative">
                  {posicion ? (
                    <MapContainer center={[posicion.lat, posicion.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker setPosicion={setPosicion} />
                      <Marker position={[posicion.lat, posicion.lng]} />
                    </MapContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                      Cargando mapa...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Coordenadas: {posicion ? `${posicion.lat.toFixed(4)}, ${posicion.lng.toFixed(4)}` : 'Seleccionando...'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-500 hover:scale-[1.02] active:scale-95'}
                `}
              >
                {loading ? 'Enviando...' : (<><Save size={20} /> Solicitar Recolección</>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
