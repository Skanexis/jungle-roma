
  import { lazy, Suspense } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initTelegramMiniApp } from "./app/services/telegramMiniApp";
  import "./styles/index.css";

  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const AdminApp = lazy(() => import("./app/admin/AdminApp.tsx"));

  if (!isAdminRoute) {
    initTelegramMiniApp();
  }

  createRoot(document.getElementById("root")!).render(
    isAdminRoute ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    ),
  );
  
