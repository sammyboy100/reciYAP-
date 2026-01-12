import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Solicitudes from "./pages/Solicitudes";
import Perfil from "./pages/Perfil";
import Tienda from "./pages/Tienda";

import Navbar from "./components/Navbar";
import SolicitarRecoleccion from "./components/SolicitarRecoleccion";
import RecicladorDashboard from "./components/RecicladorDashboard";
import CiudadanoDashboard from "./components/CiudadanoDashboard";

import { me } from "./api/auth";

function PrivateRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    return () => {
      alive = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600" />
      </div>
    );
  }

  // Si no hay sesión, vuelve al login
  if (!token || !user) return <Navigate to="/" replace />;

  // Si tiene sesión pero no tiene rol permitido
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <Navbar />
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* RECICLADOR */}
        <Route
          path="/reciclador"
          element={
            <PrivateRoute allowedRoles={["reciclador"]}>
              <RecicladorDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/solicitudes"
          element={
            <PrivateRoute allowedRoles={["admin", "reciclador"]}>
              <Navbar />
              <Solicitudes />
            </PrivateRoute>
          }
        />

        {/* CIUDADANO */}
        <Route
          path="/ciudadano"
          element={
            <PrivateRoute allowedRoles={["ciudadano"]}>
              <CiudadanoDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/solicitar-recoleccion"
          element={
            <PrivateRoute allowedRoles={["ciudadano"]}>
              <SolicitarRecoleccion />
            </PrivateRoute>
          }
        />

        <Route
          path="/tienda"
          element={
            <PrivateRoute allowedRoles={["ciudadano"]}>
              <Navbar />
              <Tienda />
            </PrivateRoute>
          }
        />

        {/* PERFIL */}
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Navbar />
              <Perfil />
            </PrivateRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
