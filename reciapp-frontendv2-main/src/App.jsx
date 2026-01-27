import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// Páginas
import Login from "./pages/Login";
import AdminUsuarios from "./pages/AdminDashboard";
import Solicitudes from "./pages/Solicitudes";
import Perfil from "./pages/Perfil";
import Tienda from "./pages/Tienda";

// Componentes
import Navbar from "./components/Navbar";
import SolicitarRecoleccion from "./components/SolicitarRecoleccion";
import RecicladorDashboard from "./components/RecicladorDashboard";
import CiudadanoDashboard from "./components/CiudadanoDashboard";
import PrecioTicker from "./components/PrecioTicker";
import ReciappcitoAssistant from './components/ReciappcitoAssistant'; // ✅ Importado

import { me } from "./api/auth";

/** Layout protegido: muestra Ticker + Navbar una sola vez */
function ProtectedLayout() {
  return (
    <div className="flex flex-col min-h-screen gap-0 overflow-x-hidden">
      <PrecioTicker />
      <Navbar />
      <div className="flex flex-col flex-grow w-full">
        <Outlet />
      </div>
    </div>
  );
}

/** Layout público (login): sin Navbar ni ticker */
function PublicLayout() {
  return <Outlet />;
}

/** Protección de rutas (con roles) */
function PrivateRoute({ allowedRoles = [] }) {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const getUser = async () => {
      try {
        if (!token) return;
        const userData = await me();
        if (alive) setUser(userData);
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
        localStorage.removeItem("token");
      } finally {
        if (alive) setLoading(false);
      }
    };
    getUser();
    return () => { alive = false; };
  }, [token]);

  if (loading && token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!token || (token && !loading && !user)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}

// ======= COMPONENTE PRINCIPAL =======
export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* ======== PÚBLICAS ======== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Login />} />
          </Route>

          {/* ======== PROTEGIDAS (Cualquier rol) ======== */}
          <Route element={<PrivateRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>

          {/* ======== ADMIN ======== */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<AdminUsuarios />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
            </Route>
          </Route>

          {/* ======== RECICLADOR ======== */}
          <Route element={<PrivateRoute allowedRoles={["reciclador"]} />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/reciclador" element={<RecicladorDashboard />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
            </Route>
          </Route>

          {/* ======== CIUDADANO ======== */}
          <Route element={<PrivateRoute allowedRoles={["ciudadano"]} />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/ciudadano" element={<CiudadanoDashboard />} />
              <Route path="/solicitar-recoleccion" element={<SolicitarRecoleccion />} />
              <Route path="/tienda" element={<Tienda />} />
            </Route>
          </Route>

          {/* ======== FALLBACK ======== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* 🟢 RECIAPPCITO OMNIPRESENTE 🟢 */}
        {/* Lo ponemos aquí, al final del BrowserRouter pero fuera de Routes */}
        <ReciappcitoAssistant />
      </div>
    </BrowserRouter>
  );
}