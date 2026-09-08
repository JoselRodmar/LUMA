import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import Apartados from "./pages/Apartados";
import Calendario from "./pages/Calendario";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/ingresos"
            element={<Ingresos />}
          />

          <Route
            path="/gastos"
            element={<Gastos />}
          />

          <Route
            path="/apartados"
            element={<Apartados />}
          />

          <Route
            path="/calendario"
            element={<Calendario />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}