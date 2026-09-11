import {
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  db,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

const colecciones = [
  "ingresos",
  "gastos",
  "movimientos",
  "apartados",
];

export default function Migracion() {
  const {
    user,
  } = useAuth();

  const [
    migrando,
    setMigrando,
  ] = useState(false);

  const [
    terminado,
    setTerminado,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    resultados,
    setResultados,
  ] = useState({});

  const migrarColeccion =
    async (
      nombreColeccion
    ) => {
      const snapshot =
        await getDocs(
          collection(
            db,
            nombreColeccion
          )
        );

      let cantidad = 0;

      for (
        const documento
        of snapshot.docs
      ) {
        /*
        Conservamos exactamente
        el mismo ID del documento.

        Por eso ejecutar esta
        migración otra vez NO
        crea duplicados.
        */

        const destino =
          doc(
            db,
            "users",
            user.uid,
            nombreColeccion,
            documento.id
          );

        await setDoc(
          destino,
          documento.data(),
          {
            merge: true,
          }
        );

        cantidad += 1;
      }

      return cantidad;
    };

  const ejecutarMigracion =
    async () => {
      if (!user) {
        return;
      }

      const confirmar =
        window.confirm(
          "Se copiarán tus datos actuales a tu cuenta personal de LUMA. Los datos originales no se eliminarán. ¿Continuar?"
        );

      if (!confirmar) {
        return;
      }

      try {
        setMigrando(true);
        setTerminado(false);
        setError("");
        setResultados({});

        /*
        ========================================
        PERFIL DEL USUARIO
        ========================================
        */

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            email:
              user.email ||
              "",

            displayName:
              user.displayName ||
              "",

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        /*
        ========================================
        MIGRACIÓN
        ========================================
        */

        const nuevoResultado =
          {};

        for (
          const nombre
          of colecciones
        ) {
          const cantidad =
            await migrarColeccion(
              nombre
            );

          nuevoResultado[
            nombre
          ] = cantidad;

          /*
          Actualizamos la pantalla
          conforme avanza.
          */

          setResultados({
            ...nuevoResultado,
          });
        }

        /*
        Marcamos en el perfil
        cuándo se realizó.
        */

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            datosMigrados:
              true,

            ultimaMigracion:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setTerminado(true);
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible completar la migración. Tus datos originales no fueron eliminados."
        );
      } finally {
        setMigrando(false);
      }
    };

  const totalMigrado =
    Object.values(
      resultados
    ).reduce(
      (
        total,
        cantidad
      ) =>
        total +
        Number(
          cantidad || 0
        ),
      0
    );

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          lg: 4,
        },

        maxWidth: 900,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: {
            xs: 29,
            md: 34,
          },

          fontWeight: 800,
        }}
      >
        Migrar mis datos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
          lineHeight: 1.6,
        }}
      >
        Este proceso preparará
        tu información actual para
        la nueva versión
        multiusuario de LUMA.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius:
              "16px",
          }}
        >
          {error}
        </Alert>
      )}

      {terminado && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius:
              "16px",
          }}
        >
          Migración terminada.
          Se copiaron {totalMigrado}{" "}
          documentos a tu cuenta.
        </Alert>
      )}

      <Card
        sx={{
          borderRadius:
            "24px",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3.5,
            },
          }}
        >
          <Typography
            fontWeight={800}
            fontSize={19}
          >
            Cuenta de destino
          </Typography>

          <Box
            sx={{
              mt: 2,

              p: 2,

              borderRadius:
                "16px",

              backgroundColor:
                "#F7F6FF",
            }}
          >
            <Typography
              fontWeight={700}
            >
              {user?.displayName ||
                "Usuario LUMA"}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
            >
              {user?.email}
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 3,
              fontWeight: 800,
            }}
          >
            Datos que se copiarán
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1,
              mt: 1.5,
            }}
          >
            <Fila
              nombre="Ingresos"
              cantidad={
                resultados.ingresos
              }
            />

            <Fila
              nombre="Gastos"
              cantidad={
                resultados.gastos
              }
            />

            <Fila
              nombre="Movimientos"
              cantidad={
                resultados.movimientos
              }
            />

            <Fila
              nombre="Apartados"
              cantidad={
                resultados.apartados
              }
            />
          </Box>

          <Box
            sx={{
              mt: 3,

              p: 2,

              borderRadius:
                "16px",

              backgroundColor:
                "#FFF8E8",
            }}
          >
            <Typography
              fontWeight={800}
              fontSize={13}
            >
              Importante
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 0.5,
                lineHeight: 1.6,
              }}
            >
              Esta operación solamente
              copia la información.
              Las colecciones actuales
              permanecerán intactas hasta
              que comprobemos que la
              versión multiusuario
              funciona correctamente.
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={
              ejecutarMigracion
            }
            disabled={
              migrando
            }
            sx={{
              mt: 3,
              py: 1.4,
            }}
          >
            {migrando ? (
              <>
                <CircularProgress
                  size={18}
                  color="inherit"
                  sx={{
                    mr: 1,
                  }}
                />

                Migrando datos...
              </>
            ) : terminado ? (
              "Ejecutar nuevamente"
            ) : (
              "Migrar mis datos"
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

function Fila({
  nombre,
  cantidad,
}) {
  return (
    <Box
      sx={{
        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        borderBottom:
          "1px solid #EEEFF3",

        py: 1.2,
      }}
    >
      <Typography>
        {nombre}
      </Typography>

      <Typography
        fontWeight={800}
        color={
          cantidad !==
          undefined
            ? "primary.main"
            : "text.secondary"
        }
      >
        {cantidad !==
        undefined
          ? cantidad
          : "—"}
      </Typography>
    </Box>
  );
}