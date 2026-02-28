import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router";
import ModalRoot from "./app/ModalRoot"
import { ModalProvider } from "./app/ModalProvider"
import AuthProvider from "./auth/AuthProvider";
import { CajaProvider } from "./context/CajaContext"
import "./styles/index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ModalProvider>
      <CajaProvider>
        <AuthProvider>
          <AppRouter />
          <ModalRoot />
        </AuthProvider>
      </CajaProvider>
    </ModalProvider>
  </React.StrictMode>
);
