import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Registro from "./pages/Registro";

import Dashboard from "./pages/Dashboard";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import Movimientos from "./pages/Movimientos";
import PlaneadoReal from "./pages/PlaneadoReal";
import Apartados from "./pages/Apartados";
import Calendario from "./pages/Calendario";
import Migracion from "./pages/Migracion";

function AppPrivada() {
  return (
    <ProtectedRoute>
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
  path="/migracion"
  element={
    <Migracion />
  }
/>
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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