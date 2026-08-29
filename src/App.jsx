import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
