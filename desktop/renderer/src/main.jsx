import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router";
import AuthProvider from "./auth/AuthProvider";
import { CajaProvider } from "./context/CajaContext"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CajaProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CajaProvider>
  </React.StrictMode>
);
