import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ThemeToggle, { iniciarTema } from "./componentes/shared/ThemeToggle";
import "./theme.css";

iniciarTema();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <ThemeToggle />
  </React.StrictMode>
);
