import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SmoothScroll from "@/components/SmoothScroll";
import MagneticCursor from "@/components/MagneticCursor";
import KonamiCode from "@/components/KonamiCode";
import SplashLoader from "@/components/SplashLoader";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Global UX layers */}
            <SmoothScroll />
            <MagneticCursor />
            <KonamiCode />
            <div className="grain" />

            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <SplashLoader />
                    <Home />
                  </>
                }
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>

            <Toaster
              theme="dark"
              position="bottom-left"
              toastOptions={{
                style: {
                  background: "var(--bg-2)",
                  color: "var(--fg)",
                  border: "1px solid var(--line)",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
