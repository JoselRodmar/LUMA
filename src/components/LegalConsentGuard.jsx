import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Box,
  CircularProgress,
} from "@mui/material";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  db,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

import {
  LEGAL,
} from "../config/legal";

export default function LegalConsentGuard({
  children,
}) {
  const {
    user,
  } = useAuth();

  const location =
    useLocation();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    consentimientoVigente,
    setConsentimientoVigente,
  ] = useState(false);

  useEffect(() => {
    let activo = true;

    const revisarConsentimiento =
      async () => {
        if (!user) {
          if (activo) {
            setLoading(false);
          }

          return;
        }

        try {
          setLoading(true);

          const referencia =
            doc(
              db,
              "users",
              user.uid
            );

          const snapshot =
            await getDoc(
              referencia
            );

          const datos =
            snapshot.exists()
              ? snapshot.data()
              : {};

          const vigente =
            datos.terminosAceptados ===
              true &&
            datos.privacidadAceptada ===
              true &&
            datos.consentimientoDatosFinancieros ===
              true &&
            datos.terminosVersion ===
              LEGAL.versionTerminos &&
            datos.privacidadVersion ===
              LEGAL.versionPrivacidad;

          if (activo) {
            setConsentimientoVigente(
              vigente
            );
          }
        } catch (error) {
          console.error(
            "Error revisando consentimiento legal:",
            error
          );

          if (activo) {
            setConsentimientoVigente(
              false
            );
          }
        } finally {
          if (activo) {
            setLoading(false);
          }
        }
      };

    revisarConsentimiento();

    return () => {
      activo = false;
    };
  }, [user?.uid]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            "#F6F7FB",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!consentimientoVigente) {
    return (
      <Navigate
        to="/consentimiento"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return children;
}