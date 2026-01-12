import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Camera, Loader2, CheckCircle2, XCircle, UploadCloud } from "lucide-react";

// ⚠️ PROTOTIPO: NO dejes esta key en frontend en producción.
const API_KEY = "AIzaSyDRgaa0IGEkBQV6DJTxTRnuUuv9s4PVgfg";

const ai = new GoogleGenAI({ apiKey: API_KEY });

export default function ReciScanner({ onAnalysisComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  async function fileToInlineData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64 = reader.result.split(",")[1];
          resolve({ data: base64, mimeType: file.type });
        } catch {
          reject(new Error("No se pudo convertir la imagen."));
        }
      };
      reader.onerror = () => reject(new Error("Error leyendo el archivo."));
      reader.readAsDataURL(file);
    });
  }

  function extractJson(text) {
    const cleaned = text.replace(/```json|```/g, "").trim();

    // intento directo
    try {
      return JSON.parse(cleaned);
    } catch {}

    // intenta extraer el primer {...}
    const i = cleaned.indexOf("{");
    const j = cleaned.lastIndexOf("}");
    if (i !== -1 && j !== -1 && j > i) {
      return JSON.parse(cleaned.slice(i, j + 1));
    }
    throw new Error("La IA no devolvió un JSON válido.");
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));

    try {
      const inlineData = await fileToInlineData(file);

      const prompt = `Eres un experto en reciclaje. Analiza la imagen proporcionada.
Identifica el material principal del objeto y determina si es comúnmente reciclable en sistemas municipales estándar.

Responde ÚNICAMENTE un JSON válido (sin markdown, sin texto extra) con ESTE formato:
{"material":"Plástico"|"Vidrio"|"Cartón"|"Papel"|"Metal"|"Orgánico"|"Otro","esReciclable":true|false,"consejo":"Una sola frase (ej: lavar y secar, separar tapa)"}`.trim();

      // ✅ Modelo recomendado (vigente)
      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData }, // imagen
            ],
          },
        ],
      });

      // La salida suele venir en candidates[0].content.parts[]
      const text =
        resp.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          ?.filter(Boolean)
          ?.join("\n") || "";

      const data = extractJson(text);

      if (!data?.material || typeof data.esReciclable !== "boolean") {
        throw new Error("Respuesta incompleta: falta material o esReciclable.");
      }

      setResult(data);

      if (onAnalysisComplete && data.material) {
        let materialNormalizado = data.material;
        if (materialNormalizado === "Cartón") materialNormalizado = "Carton";
        onAnalysisComplete(materialNormalizado);
      }
    } catch (err) {
      console.error(err);
      setError("Error de la IA: " + (err?.message || "Error desconocido"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        <Camera size={18} className="text-green-600" /> Escáner Inteligente (Opcional)
      </label>

      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="reci-scanner-input"
          disabled={loading}
        />
        <label
          htmlFor="reci-scanner-input"
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden relative
            ${
              loading
                ? "bg-gray-50 border-gray-300 cursor-not-allowed"
                : "border-green-300 hover:bg-green-50 hover:border-green-500 bg-white"
            }
            ${preview && !loading ? "border-solid" : ""}
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center text-green-600">
              <Loader2 className="animate-spin mb-2" size={32} />
              <span className="text-sm font-medium animate-pulse">Analizando con IA...</span>
            </div>
          ) : preview ? (
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400 group-hover:text-green-600 transition-colors">
              <UploadCloud size={32} className="mb-2 text-green-400" />
              <p className="text-sm font-medium text-gray-600">Toca para tomar foto o subir</p>
              <p className="text-xs text-gray-400 mt-1">La IA detectará el material</p>
            </div>
          )}

          {preview && !loading && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 z-10">
              <p className="text-white font-bold bg-black/50 px-3 py-1 rounded-full text-sm">
                Cambiar foto
              </p>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
          <XCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && !loading && (
        <div
          className={`mt-4 p-4 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
            result.esReciclable ? "bg-green-50 border-green-400" : "bg-amber-50 border-amber-400"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            {result.esReciclable ? (
              <CheckCircle2 size={32} className="text-green-600" />
            ) : (
              <XCircle size={32} className="text-amber-600" />
            )}
            <div>
              <h4 className={`font-black text-lg ${result.esReciclable ? "text-green-800" : "text-amber-800"}`}>
                {result.material} {result.esReciclable ? "✅ Reciclable" : "⚠️ No Reciclable"}
              </h4>
            </div>
          </div>
          <p className={`text-sm italic ${result.esReciclable ? "text-green-700" : "text-amber-700"}`}>
            💡 Consejo: {result.consejo}
          </p>
        </div>
      )}
    </div>
  );
}
