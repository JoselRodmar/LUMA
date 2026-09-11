import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import LegalConsentGuard from "./components/LegalConsentGuard";
import OnboardingGuard from "./components/OnboardingGuard";
import NetworkStatus from "./components/NetworkStatus";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Bienvenida from "./pages/Bienvenida";
import ConsentimientoLegal from "./pages/ConsentimientoLegal";

import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";

import Dashboard from "./pages/Dashboard";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import Movimientos from "./pages/Movimientos";
import PlaneadoReal from "./pages/PlaneadoReal";
import Apartados from "./pages/Apartados";
import Calendario from "./pages/Calendario";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

function AppPrivada() {
  return (
    <ProtectedRoute>
      <LegalConsentGuard>
        <OnboardingGuard>
          <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard />
                }
              />

              <Route
                path="/ingresos"
                element={
                  <Ingresos />
                }
              />

              <Route
                path="/gastos"
                element={
                  <Gastos />
                }
              />

              <Route
                path="/movimientos"
                element={
                  <Movimientos />
                }
              />

              <Route
                path="/planeado-real"
                element={
                  <PlaneadoReal />
                }
              />

              <Route
                path="/apartados"
                element={
                  <Apartados />
                }
              />

              <Route
                path="/calendario"
                element={
                  <Calendario />
                }
              />

              <Route
                path="/configuracion"
                element={
                  <Configuracion />
                }
              />

              <Route
                path="*"
                element={
                  <NotFound />
                }
              />
            </Routes>
          </Layout>
        </OnboardingGuard>
      </LegalConsentGuard>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkStatus />

        <Routes>
          <Route
            path="/login"
            element={
              <Login />
            }
          />

          <Route
            path="/registro"
            element={
              <Registro />
            }
          />

          <Route
            path="/privacidad"
            element={
              <Privacidad />
            }
          />

          <Route
            path="/terminos"
            element={
              <Terminos />
            }
          />

          <Route
            path="/consentimiento"
            element={
              <ProtectedRoute>
                <ConsentimientoLegal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bienvenida"
            element={
              <ProtectedRoute>
                <LegalConsentGuard>
                  <Bienvenida />
                </LegalConsentGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/*"
            element={
              <AppPrivada />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}