import api from "../utils/fetchClient";

export const login = async (correo, contrasena) => {
  const res = await api.post("/auth/login", { correo, contrasena });
  const token = res.data.access_token;
  localStorage.setItem("token", token);
  
  // Actualizar el header de axios inmediatamente
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return res.data;
};

export const me = async () => {
  const res = await api.get("/api/usuarios/me");
  return res.data;
};