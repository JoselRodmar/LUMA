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
} from "react-router-dom";

import {
  db,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

export default function OnboardingGuard({
  children,
}) {
  const {
    user,
  } = useAuth();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    onboardingCompleto,
    setOnboardingCompleto,
  ] = useState(false);

  useEffect(() => {
    const revisarPerfil =
      async () => {
        if (!user) {
          return;
        }

        try {
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

          if (!snapshot.exists()) {
            setOnboardingCompleto(
              false
            );

            return;
          }

          const datos =
            snapshot.data();

          setOnboardingCompleto(
            datos.onboardingCompleto ===
              true
          );
        } catch (error) {
          console.error(
            "Error revisando onboarding:",
            error
          );

          setOnboardingCompleto(
            false
          );
        } finally {
          setLoading(false);
        }
      };

    revisarPerfil();
  }, [user]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          backgroundColor:
            "#F6F7FB",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!onboardingCompleto) {
    return (
      <Navigate
        to="/bienvenida"
        replace
      />
    );
  }

  return children;
}