import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  db,
  provider,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

const coleccionesUsuario = [
  "ingresos",
  "gastos",
  "movimientos",
  "apartados",
];

export default function Configuracion() {
  const {
    user,
    cerrarSesion,
    recuperarPassword,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    pais,
    setPais,
  ] = useState("México");

  const [
    moneda,
    setMoneda,
  ] = useState("MXN");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    enviandoPassword,
    setEnviandoPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    dialogoEliminar,
    setDialogoEliminar,
  ] = useState(false);

  const [
    confirmacion,
    setConfirmacion,
  ] = useState("");

  const [
    passwordEliminar,
    setPasswordEliminar,
  ] = useState("");

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const proveedores =
    useMemo(() => {
      return (
        user?.providerData?.map(
          (item) =>
            item.providerId
        ) || []
      );
    }, [user]);

  const usaPassword =
    proveedores.includes(
      "password"
    );

  const usaGoogle =
    proveedores.includes(
      "google.com"
    );

  useEffect(() => {
    const cargarPerfil =
      async () => {
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

          if (
            snapshot.exists()
          ) {
            const datos =
              snapshot.data();

            setNombre(
              datos.displayName ||
                user.displayName ||
                ""
            );

            setPais(
              datos.pais ||
                "México"
            );

            setMoneda(
              datos.moneda ||
                "MXN"
            );
          } else {
            setNombre(
              user.displayName ||
                ""
            );
          }
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible cargar tu configuración."
          );
        } finally {
          setLoading(false);
        }
      };

    cargarPerfil();
  }, [user]);

  const guardarPerfil =
    async () => {
      const nombreLimpio =
        nombre.trim();

      if (!nombreLimpio) {
        setError(
          "Escribe tu nombre."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");
        setMensaje("");

        await updateProfile(
          user,
          {
            displayName:
              nombreLimpio,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            displayName:
              nombreLimpio,

            email:
              user.email ||
              "",

            pais,

            moneda,

            onboardingCompleto:
              true,

            perfilActualizado:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setMensaje(
          "Tu configuración se guardó correctamente."
        );
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar los cambios."
        );
      } finally {
        setGuardando(false);
      }
    };

  const cambiarPassword =
    async () => {
      if (!user?.email) {
        setError(
          "Esta cuenta no tiene un correo disponible."
        );

        return;
      }

      try {
        setEnviandoPassword(
          true
        );

        setError("");
        setMensaje("");

        await recuperarPassword(
          user.email
        );

        setMensaje(
          "Te enviamos un correo para restablecer tu contraseña."
        );
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible enviar el correo de recuperación."
        );
      } finally {
        setEnviandoPassword(
          false
        );
      }
    };

  const abrirEliminar =
    () => {
      setConfirmacion("");
      setPasswordEliminar("");
      setError("");
      setMensaje("");
      setDialogoEliminar(
        true
      );
    };

  const cerrarEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setDialogoEliminar(
        false
      );

      setConfirmacion("");
      setPasswordEliminar("");
    };

  const reautenticar =
    async () => {
      if (usaPassword) {
        if (
          !passwordEliminar
        ) {
          throw new Error(
            "PASSWORD_REQUERIDO"
          );
        }

        if (!user.email) {
          throw new Error(
            "SIN_EMAIL"
          );
        }

        const credencial =
          EmailAuthProvider.credential(
            user.email,
            passwordEliminar
          );

        await reauthenticateWithCredential(
          user,
          credencial
        );

        return;
      }

      if (usaGoogle) {
        await reauthenticateWithPopup(
          user,
          provider
        );

        return;
      }

      throw new Error(
        "PROVEEDOR_NO_COMPATIBLE"
      );
    };

  const eliminarSubcoleccion =
    async (
      nombreColeccion
    ) => {
      const referencia =
        collection(
          db,
          "users",
          user.uid,
          nombreColeccion
        );

      const snapshot =
        await getDocs(
          referencia
        );

      const documentos =
        snapshot.docs;

      /*
        Firestore admite un máximo
        de 500 operaciones por batch.

        Utilizamos lotes de 450 para
        mantener margen de seguridad.
      */

      for (
        let inicio = 0;
        inicio <
        documentos.length;
        inicio += 450
      ) {
        const bloque =
          documentos.slice(
            inicio,
            inicio + 450
          );

        const batch =
          writeBatch(db);

        bloque.forEach(
          (documento) => {
            batch.delete(
              documento.ref
            );
          }
        );

        await batch.commit();
      }
    };

  const eliminarCuenta =
    async () => {
      if (
        confirmacion.trim() !==
        "ELIMINAR"
      ) {
        setError(
          'Escribe exactamente "ELIMINAR" para continuar.'
        );

        return;
      }

      try {
        setEliminando(true);
        setError("");
        setMensaje("");

        /*
        1. Reautenticamos ANTES
        de borrar cualquier dato.
        */

        await reautenticar();

        /*
        2. Eliminamos todos los
        registros financieros.
        */

        for (
          const nombreColeccion
          of coleccionesUsuario
        ) {
          await eliminarSubcoleccion(
            nombreColeccion
          );
        }

        /*
        3. Eliminamos el perfil
        del usuario.
        */

        await deleteDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

        /*
        4. Finalmente eliminamos
        la cuenta de Authentication.

        Esto va al final porque
        necesitamos estar autenticados
        para borrar Firestore.
        */

        await deleteUser(
          user
        );

        setDialogoEliminar(
          false
        );

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "Error eliminando cuenta:",
          err
        );

        if (
          err.message ===
          "PASSWORD_REQUERIDO"
        ) {
          setError(
            "Escribe tu contraseña actual para confirmar tu identidad."
          );
        } else if (
          err.code ===
            "auth/invalid-credential" ||
          err.code ===
            "auth/wrong-password"
        ) {
          setError(
            "La contraseña es incorrecta."
          );
        } else if (
          err.code ===
          "auth/popup-closed-by-user"
        ) {
          setError(
            "Debes completar la confirmación con Google para eliminar la cuenta."
          );
        } else if (
          err.code ===
          "auth/requires-recent-login"
        ) {
          setError(
            "Por seguridad, vuelve a iniciar sesión e intenta eliminar la cuenta nuevamente."
          );
        } else {
          setError(
            "No fue posible eliminar la cuenta. No continúes intentando si observas información faltante; revisemos primero el error."
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            "70vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          lg: 4,
        },

        maxWidth: 1000,
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
        Mi cuenta
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Administra tu perfil y
        preferencias de LUMA.
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

      {mensaje && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius:
              "16px",
          }}
        >
          {mensaje}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius:
            "24px",

          mb: 3,
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
            fontSize={20}
            fontWeight={800}
          >
            Perfil
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{
              mt: 0.5,
              mb: 3,
            }}
          >
            Información básica de
            tu cuenta.
          </Typography>

          <Box
            sx={{
              display:
                "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md:
                  "repeat(2, 1fr)",
              },

              gap: 2,
            }}
          >
            <TextField
              label="Nombre"
              value={nombre}
              onChange={(
                event
              ) =>
                setNombre(
                  event.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="Correo electrónico"
              value={
                user?.email ||
                ""
              }
              disabled
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>
                País
              </InputLabel>

              <Select
                value={pais}
                label="País"
                onChange={(
                  event
                ) =>
                  setPais(
                    event.target.value
                  )
                }
              >
                <MenuItem value="México">
                  México
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>
                Moneda
              </InputLabel>

              <Select
                value={moneda}
                label="Moneda"
                onChange={(
                  event
                ) =>
                  setMoneda(
                    event.target.value
                  )
                }
              >
                <MenuItem value="MXN">
                  Peso mexicano
                  (MXN)
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography
            color="text.secondary"
            fontSize={12}
            sx={{
              mt: 2,
              lineHeight: 1.6,
            }}
          >
            LUMA utiliza actualmente
            pesos mexicanos. La moneda
            queda guardada en tu perfil
            para futuras ampliaciones.
          </Typography>

          <Button
            variant="contained"
            onClick={
              guardarPerfil
            }
            disabled={
              guardando
            }
            sx={{
              mt: 3,
            }}
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius:
            "24px",

          mb: 3,
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
            fontSize={20}
            fontWeight={800}
          >
            Seguridad
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{
              mt: 0.5,
            }}
          >
            Administra el acceso a
            tu cuenta.
          </Typography>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <Box
            sx={{
              display:
                "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              justifyContent:
                "space-between",

              alignItems: {
                xs: "stretch",
                sm: "center",
              },

              gap: 2,
            }}
          >
            <Box>
              <Typography
                fontWeight={800}
              >
                Contraseña
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Recibe un correo para
                establecer una nueva
                contraseña.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={
                cambiarPassword
              }
              disabled={
                enviandoPassword
              }
            >
              {enviandoPassword
                ? "Enviando..."
                : "Cambiar contraseña"}
            </Button>
          </Box>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <Box
            sx={{
              display:
                "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              justifyContent:
                "space-between",

              alignItems: {
                xs: "stretch",
                sm: "center",
              },

              gap: 2,
            }}
          >
            <Box>
              <Typography
                fontWeight={800}
              >
                Cerrar sesión
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Sal de LUMA en este
                dispositivo.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              onClick={
                cerrarSesion
              }
            >
              Cerrar sesión
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius:
            "24px",

          border:
            "1px solid #FFD5D5",
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
            fontSize={20}
            fontWeight={800}
            color="error"
          >
            Zona de peligro
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{
              mt: 0.7,
              lineHeight: 1.6,
            }}
          >
            Eliminar tu cuenta borrará
            permanentemente tus ingresos,
            gastos, movimientos,
            apartados y perfil de LUMA.
          </Typography>

          <Typography
            color="error"
            fontSize={13}
            fontWeight={700}
            sx={{
              mt: 1,
            }}
          >
            Esta acción no se puede
            deshacer.
          </Typography>

          <Button
            color="error"
            variant="outlined"
            onClick={
              abrirEliminar
            }
            sx={{
              mt: 2,
            }}
          >
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={
          dialogoEliminar
        }
        onClose={
          cerrarEliminar
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Eliminar cuenta
        </DialogTitle>

        <DialogContent>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius:
                "16px",
            }}
          >
            Se eliminarán
            permanentemente todos tus
            datos financieros y tu
            acceso a LUMA.
          </Alert>

          <Typography
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Escribe ELIMINAR para
            confirmar:
          </Typography>

          <TextField
            fullWidth
            value={
              confirmacion
            }
            onChange={(
              event
            ) =>
              setConfirmacion(
                event.target.value
              )
            }
            placeholder="ELIMINAR"
            disabled={
              eliminando
            }
          />

          {usaPassword && (
            <>
              <Typography
                sx={{
                  fontWeight: 700,
                  mt: 3,
                  mb: 1,
                }}
              >
                Confirma tu contraseña:
              </Typography>

              <TextField
                fullWidth
                type="password"
                value={
                  passwordEliminar
                }
                onChange={(
                  event
                ) =>
                  setPasswordEliminar(
                    event.target.value
                  )
                }
                label="Contraseña actual"
                disabled={
                  eliminando
                }
              />
            </>
          )}

          {usaGoogle && !usaPassword && (
            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 3,
                lineHeight: 1.6,
              }}
            >
              Google te pedirá confirmar
              nuevamente tu identidad
              antes de eliminar la
              cuenta.
            </Typography>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
          }}
        >
          <Button
            onClick={
              cerrarEliminar
            }
            disabled={
              eliminando
            }
          >
            Cancelar
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={
              eliminarCuenta
            }
            disabled={
              eliminando ||
              confirmacion.trim() !==
                "ELIMINAR"
            }
          >
            {eliminando
              ? "Eliminando..."
              : "Eliminar definitivamente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}