import React from "react";
import { Navigate } from "react-router-dom";

const RutaProtegida = ({ children }) => {

  const estaLogeado = !!localStorage.getItem("usuario-supabase");

  return estaLogeado ? children : <Navigate to="/login" replace />;
};

export default RutaProtegida;