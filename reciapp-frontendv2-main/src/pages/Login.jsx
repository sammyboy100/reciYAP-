import { useState, useEffect } from "react";
import { login, me } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  // 🟢 ESTADOS PARA MODALES (NUEVOS)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 🟢 ESTADOS ORIGINALES (Mantenidos al 100%)
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerData, setRegisterData] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    rol: "ciudadano",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // 🟢 LÓGICA ORIGINAL: Carrusel de Reciappcito
  const reciImages = ["/reciappcito/reciappcito.png"];
  const [activeReciIndex, setActiveReciIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReciIndex((prev) => (prev + 1) % reciImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [reciImages.length]);

  // 🟢 LÓGICA ORIGINAL: Chat n8n
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `:root { --chat--color--primary: #10b981; }`;
    document.head.appendChild(style);
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'; createChat({ webhookUrl: 'https://n8n.rubro.pe/webhook/c749da76-4750-4f74-b84d-6249c0122e5b/chat' });`;
    document.body.appendChild(script);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      document.body.removeChild(script);
    };
  }, []);

  // 🟢 HANDLERS ORIGINALES (Sin cambios)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(correo, contrasena);
      const user = await me();
      const rol = (user?.rol || "").toLowerCase();
      if (rol === "admin") navigate("/dashboard", { replace: true });
      else if (rol === "reciclador") navigate("/reciclador", { replace: true });
      else navigate("/ciudadano", { replace: true });
    } catch (err) {
      alert("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.contrasena !== registerData.confirmarContrasena) return alert("Las contraseñas no coinciden");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      if (response.ok) {
        alert("¡Registro exitoso! Inicia sesión");
        setShowRegisterModal(false);
        setShowLoginModal(true);
      }
    } catch (err) {
      alert("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      
      {/* 🟢 NAVBAR (Inspirado en la imagen) */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black italic shadow-lg">R</div>
            <span className="text-2xl font-black text-emerald-900 tracking-tighter">ReciYAP!</span>
          </div>
          
          <div className="hidden md:flex gap-8 font-semibold text-slate-600">
            <a href="#inicio" className="hover:text-emerald-500 transition-colors">Inicio</a>
            <a href="#beneficios" className="hover:text-emerald-500 transition-colors">Beneficios</a>
            <a href="#unete" className="hover:text-emerald-500 transition-colors">Registro</a>
            <a href="#contacto" className="hover:text-emerald-500 transition-colors">Contacto</a>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowLoginModal(true)} className="px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all">Iniciar Sesión</button>
            <button onClick={() => setShowRegisterModal(true)} className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md">Registrarse</button>
          </div>
        </div>
      </nav>

      {/* 🟢 MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-10 relative animate-fade-in shadow-2xl">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-2xl font-bold">✕</button>
            <h2 className="text-3xl font-black text-emerald-900 mb-6">Bienvenido</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" placeholder="Correo" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
              <input type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
              <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">{loading ? "Entrando..." : "Acceder"}</button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 MODAL REGISTRO */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-10 relative animate-fade-in shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowRegisterModal(false)} className="absolute top-6 right-6 text-2xl font-bold">✕</button>
            <h2 className="text-3xl font-black text-emerald-900 mb-6">Crea tu cuenta</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" placeholder="Nombre completo" className="w-full p-4 bg-slate-50 rounded-xl outline-none" onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-xl outline-none" onChange={(e) => setRegisterData({...registerData, correo: e.target.value})} required />
              <select className="w-full p-4 bg-slate-50 rounded-xl outline-none" onChange={(e) => setRegisterData({...registerData, rol: e.target.value})}>
                <option value="ciudadano">Ciudadano</option>
                <option value="reciclador">Reciclador</option>
              </select>
              <input type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 rounded-xl outline-none" onChange={(e) => setRegisterData({...registerData, contrasena: e.target.value})} required />
              <input type="password" placeholder="Confirmar" className="w-full p-4 bg-slate-50 rounded-xl outline-none" onChange={(e) => setRegisterData({...registerData, confirmarContrasena: e.target.value})} required />
              <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">{loading ? "Procesando..." : "Registrarme"}</button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 SECCIÓN HERO (Basada en image_a88970) */}
      <header id="inicio" className="pt-32 pb-20 bg-gradient-to-br from-emerald-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full font-bold text-sm tracking-wide">🌱 Plataforma Eco-Friendly</span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
              Conectamos <span className="text-emerald-500">Recicladores</span> con Ciudadanos para un Gran Cambio
            </h1>
            <p className="text-lg text-slate-500 max-w-lg">ReciYAP! es la plataforma que facilita el reciclaje conectando a ciudadanos con recicladores certificados. Juntos creamos un impacto positivo.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowRegisterModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-emerald-200">Solicitar Recolección</button>
              <button onClick={() => setShowRegisterModal(true)} className="border-2 border-emerald-500 text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all">Ser Reciclador →</button>
            </div>
            <div className="flex gap-8 pt-4">
              <div><p className="text-3xl font-black text-slate-800">15K+</p><p className="text-xs text-slate-400 font-bold uppercase">Usuarios</p></div>
              <div><p className="text-3xl font-black text-slate-800">500+</p><p className="text-xs text-slate-400 font-bold uppercase">Recicladores</p></div>
              <div><p className="text-3xl font-black text-slate-800">2M kg</p><p className="text-xs text-slate-400 font-bold uppercase">Reciclados</p></div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-[120px] opacity-10" />
            <img src={reciImages[activeReciIndex]} className="w-full max-w-md z-10 animate-float" alt="Mascota" />
          </div>
        </div>
      </header>

      {/* 🟢 BENEFICIOS (Basada en image_a88993) */}
      <section id="beneficios" className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800" className="rounded-[3rem] shadow-2xl border-8 border-white" alt="Reciclador" />
          </div>
          <div className="lg:w-1/2 space-y-8">
            <h2 className="text-5xl font-black text-slate-800">Beneficios de Usar <span className="text-emerald-500">ReciYAP!</span></h2>
            <p className="text-slate-500 text-lg">Nuestra plataforma ofrece una experiencia completa y segura para facilitar el reciclaje en tu comunidad.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {icon: "🕒", title: "Rastreo en Tiempo Real", desc: "Sigue la ubicación del reciclador hasta tu puerta."},
                {icon: "🛡️", title: "Recicladores Verificados", desc: "Todos certificados para tu seguridad."},
                {icon: "📊", title: "Impacto Medible", desc: "Visualiza tu contribución con estadísticas."},
                {icon: "🤝", title: "Comunidad Activa", desc: "Únete a miles comprometidos con el ambiente."}
              ].map((b, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <span className="text-3xl mb-4 block">{b.icon}</span>
                  <h4 className="font-bold text-slate-800 mb-2">{b.title}</h4>
                  <p className="text-slate-500 text-sm">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 ROLES (Basada en image_a889ce) */}
      <section id="unete" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">Únete a ReciYAP!</h2>
            <p className="text-slate-500 mt-2">Elige tu rol y comienza a hacer la diferencia hoy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-50 p-12 rounded-[3rem] space-y-6 border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl">🏠</div>
              <h3 className="text-3xl font-black text-emerald-900">Para Ciudadanos</h3>
              <p className="text-emerald-800/60">¿Tienes material para reciclar? Solicita una recolección fácil y rápida.</p>
              <ul className="space-y-3 text-emerald-800/80 font-medium">
                <li>✓ Recolección a domicilio sin costo</li>
                <li>✓ Recompensas por reciclar</li>
              </ul>
              <button onClick={() => setShowRegisterModal(true)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Solicitar Recolección Ahora</button>
            </div>
            <div className="bg-slate-900 p-12 rounded-[3rem] space-y-6 text-white">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl">🚚</div>
              <h3 className="text-3xl font-black">Para Recicladores</h3>
              <p className="text-slate-400">¿Quieres ser parte de la red? Genera ingresos mientras ayudas al planeta.</p>
              <ul className="space-y-3 text-slate-300">
                <li>✓ Rutas optimizadas con IA</li>
                <li>✓ Pagos seguros y rápidos</li>
              </ul>
              <button onClick={() => setShowRegisterModal(true)} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold">Únete a la Red</button>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 IMPACTO (Basada en image_a889af) */}
      <section className="py-24 bg-emerald-600 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <p className="uppercase tracking-widest font-bold text-emerald-200 mb-4">(Nuestro Impacto)</p>
          <h2 className="text-5xl font-black mb-16">Juntos Creamos un Gran Cambio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div><p className="text-5xl font-black">2.5M+</p><p className="text-emerald-100 text-sm mt-2">kg Reciclados</p></div>
            <div><p className="text-5xl font-black">15K+</p><p className="text-emerald-100 text-sm mt-2">Ciudadanos Activos</p></div>
            <div><p className="text-5xl font-black">500+</p><p className="text-emerald-100 text-sm mt-2">Recicladores Certificados</p></div>
            <div><p className="text-5xl font-black">50+</p><p className="text-emerald-100 text-sm mt-2">Ciudades Cubiertas</p></div>
          </div>
          <p className="text-2xl italic font-serif opacity-80">"Cada acción cuenta. Cada reciclaje importa. Juntos construimos un futuro sostenible."</p>
        </div>
      </section>

      {/* 🟢 FAQ & CONTACTO (Basada en image_a889ee y image_a88a0f) */}
      <section className="py-24 bg-white max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-black text-center mb-16">Preguntas Frecuentes</h2>
        <div className="space-y-4 mb-24">
          {["¿Cómo funciona ReciYAP!?", "¿Tiene algún costo el servicio?", "¿Qué materiales puedo reciclar?"].map((q, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-2xl flex justify-between items-center font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-all">
              <span>{q}</span>
              <span className="text-emerald-500">v</span>
            </div>
          ))}
        </div>

        <div id="contacto" className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-24 border-t border-slate-100">
          <div className="space-y-8">
            <h2 className="text-4xl font-black">Contáctanos</h2>
            <p className="text-slate-500">Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos pronto.</p>
            <div className="space-y-6">
              <div className="flex gap-4 items-center font-medium">
                <span className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">✉️</span>
                <div><p className="text-slate-400 text-xs">Email</p><p>contacto@reciyap.com</p></div>
              </div>
              <div className="flex gap-4 items-center font-medium">
                <span className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">📞</span>
                <div><p className="text-slate-400 text-xs">Teléfono</p><p>+51 (1) 123-4567</p></div>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-10 rounded-[2rem] border border-emerald-100">
             <form className="space-y-4">
                <input type="text" placeholder="Nombre completo" className="w-full p-4 bg-white rounded-xl border-none shadow-sm" />
                <input type="email" placeholder="Email" className="w-full p-4 bg-white rounded-xl border-none shadow-sm" />
                <textarea placeholder="Mensaje" rows="4" className="w-full p-4 bg-white rounded-xl border-none shadow-sm"></textarea>
                <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Enviar Mensaje</button>
             </form>
          </div>
        </div>
      </section>

      {/* 🟢 FOOTER (Basada en image_a88a2a) */}
      <footer className="bg-emerald-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black italic">R</div>
              <span className="text-2xl font-black tracking-tighter">ReciYAP!</span>
            </div>
            <p className="text-emerald-100/60 text-sm">Conectando comunidades para un planeta más limpio. Cada acción cuenta, cada reciclaje importa.</p>
          </div>
          <div><h4 className="font-bold mb-6">Plataforma</h4><ul className="space-y-3 text-emerald-100/40 text-sm"><li>Cómo Funciona</li><li>Beneficios</li><li>Registro</li></ul></div>
          <div><h4 className="font-bold mb-6">Comunidad</h4><ul className="space-y-3 text-emerald-100/40 text-sm"><li>Blog</li><li>Historias de Éxito</li><li>Aliados</li></ul></div>
          <div><h4 className="font-bold mb-6">Soporte</h4><ul className="space-y-3 text-emerald-100/40 text-sm"><li>Centro de Ayuda</li><li>Términos y Condiciones</li><li>Privacidad</li></ul></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-emerald-100/30 font-bold uppercase tracking-widest">
           <p>© 2026 RECIYAP!. TODOS LOS DERECHOS RESERVADOS.</p>
           <div className="flex gap-4 mt-4 md:mt-0"><span>FB</span><span>TW</span><span>IG</span><span>LI</span></div>
        </div>
      </footer>
    </div>
  );
}