import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import App from "./App.tsx";
import FacebookCallback from "./pages/FacebookCallback.tsx";
import { PublicShop } from "./components/PublicShop.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { LanguageProvider } from "./contexts/LanguageContext.tsx";

function PublicShopRoute() {
  const { shopId } = useParams<{ shopId: string }>();
  return <PublicShop shopId={shopId || ""} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/facebook/callback" element={<FacebookCallback />} />
              <Route path="/shop/:shopId" element={<PublicShopRoute />} />
              <Route path="/*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
