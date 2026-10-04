import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { iniciarTema } from "./componentes/shared/ThemeToggle";
import "./theme.css";
import { lerUsuario, usuarioSeguro } from "./canteiro/sessao";

iniciarTema();
// Remove campos sensíveis de sessões gravadas por versões anteriores.
if (localStorage.getItem("usuario")) localStorage.setItem("usuario", JSON.stringify(usuarioSeguro(lerUsuario())));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
