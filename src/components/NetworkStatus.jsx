import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Collapse,
} from "@mui/material";

export default function NetworkStatus() {
  const [
    online,
    setOnline,
  ] = useState(
    navigator.onLine
  );

  const [
    reconectado,
    setReconectado,
  ] = useState(false);

  useEffect(() => {
    let temporizador;

    const manejarOffline = () => {
      setOnline(false);
      setReconectado(false);
    };

    const manejarOnline = () => {
      setOnline(true);
      setReconectado(true);

      temporizador =
        window.setTimeout(
          () => {
            setReconectado(false);
          },
          3500
        );
    };

    window.addEventListener(
      "offline",
      manejarOffline
    );

    window.addEventListener(
      "online",
      manejarOnline
    );

    return () => {
      window.removeEventListener(
        "offline",
        manejarOffline
      );

      window.removeEventListener(
        "online",
        manejarOnline
      );

      if (temporizador) {
        window.clearTimeout(
          temporizador
        );
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform:
          "translateX(-50%)",
        width:
          "calc(100% - 32px)",
        maxWidth: 650,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Collapse
        in={!online}
      >
        <Alert
          severity="warning"
          variant="filled"
          sx={{
            borderRadius: "16px",
            boxShadow:
              "0 10px 35px rgba(0,0,0,.15)",
            pointerEvents: "auto",
          }}
        >
          Sin conexión a Internet. Algunas funciones de
          LUMA podrían no cargar o guardar cambios hasta
          recuperar la conexión.
        </Alert>
      </Collapse>

      <Collapse
        in={
          online &&
          reconectado
        }
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            borderRadius: "16px",
            boxShadow:
              "0 10px 35px rgba(0,0,0,.15)",
            pointerEvents: "auto",
          }}
        >
          Conexión restablecida.
        </Alert>
      </Collapse>
    </Box>
  );
}