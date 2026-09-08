import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  db,
} from "../services/firebase";

import {
  formatearDinero,
} from "../utils/frecuencia";

import {
  calcularApartadoSemanal,
  calcularDiasRestantes,
  calcularPendienteApartado,
  calcularPorcentajeApartado,
} from "../utils/apartados";

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

export default function Apartados() {
  const [
    lugar,
    setLugar,
  ] = useState("Casa");

  const [
    concepto,
    setConcepto,
  ] = useState("");

  const [
    montoObjetivo,
    setMontoObjetivo,
  ] = useState("");

  const [
    ahorrado,
    setAhorrado,
  ] = useState("");

  const [
    fechaVencimiento,
    setFechaVencimiento,
  ] = useState("");

  const [
    apartados,
    setApartados,
  ] = useState([]);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const cargarApartados =
    async () => {
      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "apartados"
            )
          );

        const lista =
          snapshot.docs.map(
            (documento) => ({
              id:
                documento.id,

              ...documento.data(),
            })
          );

        lista.sort(
          (a, b) =>
            String(
              a.fechaVencimiento ||
                ""
            ).localeCompare(
              String(
                b.fechaVencimiento ||
                  ""
              )
            )
        );

        setApartados(lista);
      } catch (error) {
        console.error(error);
      }
    };

  useEffect(() => {
    cargarApartados();
  }, []);

  const guardarApartado =
    async () => {
      if (
        !concepto.trim() ||
        !montoObjetivo ||
        !fechaVencimiento
      ) {
        return;
      }

      try {
        setGuardando(true);

        await addDoc(
          collection(
            db,
            "apartados"
          ),
          {
            lugar,

            concepto:
              concepto.trim(),

            montoObjetivo:
              Number(
                montoObjetivo
              ),

            ahorrado:
              Number(
                ahorrado || 0
              ),

            fechaVencimiento,

            activo: true,

            createdAt:
              serverTimestamp(),
          }
        );

        setConcepto("");
        setMontoObjetivo("");
        setAhorrado("");
        setFechaVencimiento("");

        await cargarApartados();
      } catch (error) {
        console.error(error);
      } finally {
        setGuardando(false);
      }
    };

  const sumarAhorro =
    async (
      apartado,
      cantidad
    ) => {
      const valor =
        Number(cantidad);

      if (
        !valor ||
        valor <= 0
      ) {
        return;
      }

      const nuevoAhorrado =
        Math.min(
          Number(
            apartado.montoObjetivo ||
              0
          ),
          Number(
            apartado.ahorrado ||
              0
          ) + valor
        );

      await updateDoc(
        doc(
          db,
          "apartados",
          apartado.id
        ),
        {
          ahorrado:
            nuevoAhorrado,
        }
      );

      cargarApartados();
    };

  const eliminarApartado =
    async (id) => {
      const confirmar =
        window.confirm(
          "¿Eliminar este apartado?"
        );

      if (!confirmar) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "apartados",
          id
        )
      );

      cargarApartados();
    };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          lg: 4,
        },

        maxWidth: 1350,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: 32,
          fontWeight: 800,
        }}
      >
        Apartados
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Prepárate hoy para
        los gastos que sabes
        que llegarán después.
      </Typography>

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 800,
              mb: 3,
            }}
          >
            Nuevo apartado
          </Typography>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",
                  md:
                    "repeat(2, 1fr)",
                },

              gap: 2,
            }}
          >
            <TextField
              select
              label="Espacio"
              value={lugar}
              onChange={(e) =>
                setLugar(
                  e.target.value
                )
              }
            >
              {lugares.map(
                (item) => (
                  <MenuItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              label="Concepto"
              placeholder="Ej. Seguro del auto"
              value={concepto}
              onChange={(e) =>
                setConcepto(
                  e.target.value
                )
              }
            />

            <TextField
              label="Monto objetivo"
              type="number"
              value={
                montoObjetivo
              }
              onChange={(e) =>
                setMontoObjetivo(
                  e.target.value
                )
              }
            />

            <TextField
              label="Ya reservado"
              type="number"
              value={ahorrado}
              onChange={(e) =>
                setAhorrado(
                  e.target.value
                )
              }
            />

            <TextField
              label="Fecha límite"
              type="date"
              value={
                fechaVencimiento
              }
              onChange={(e) =>
                setFechaVencimiento(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                gridColumn: {
                  md: "span 2",
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={
              guardarApartado
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
              : "Crear apartado"}
          </Button>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 2,
        }}
      >
        {apartados.map(
          (apartado) => {
            const objetivo =
              Number(
                apartado.montoObjetivo ||
                  0
              );

            const reservado =
              Number(
                apartado.ahorrado ||
                  0
              );

            const pendiente =
              calcularPendienteApartado(
                objetivo,
                reservado
              );

            const semanal =
              calcularApartadoSemanal(
                objetivo,
                reservado,
                apartado.fechaVencimiento
              );

            const porcentaje =
              calcularPorcentajeApartado(
                objetivo,
                reservado
              );

            const dias =
              calcularDiasRestantes(
                apartado.fechaVencimiento
              );

            const completado =
              pendiente <= 0;

            return (
              <Card
                key={
                  apartado.id
                }
                sx={{
                  borderRadius:
                    "24px",
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2.5,
                      md: 3,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display:
                        "flex",

                      flexDirection:
                        {
                          xs: "column",
                          md: "row",
                        },

                      justifyContent:
                        "space-between",

                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                        fontWeight={700}
                      >
                        {
                          apartado.lugar
                        }
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight:
                            800,

                          fontSize:
                            21,

                          mt: 0.5,
                        }}
                      >
                        {
                          apartado.concepto
                        }
                      </Typography>

                      <Typography
                        color="text.secondary"
                        fontSize={13}
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        Fecha límite:{" "}
                        {
                          apartado.fechaVencimiento
                        }
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        textAlign: {
                          xs: "left",
                          md: "right",
                        },
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Apartar por semana
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight:
                            800,

                          fontSize:
                            24,

                          color:
                            completado
                              ? "#10B981"
                              : "#6D5DFB",
                        }}
                      >
                        {completado
                          ? "Completo"
                          : formatearDinero(
                              semanal
                            )}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                    }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={
                        porcentaje
                      }
                      sx={{
                        height: 10,
                        borderRadius:
                          10,

                        backgroundColor:
                          "#ECEEF3",

                        "& .MuiLinearProgress-bar":
                          {
                            borderRadius:
                              10,

                            backgroundColor:
                              completado
                                ? "#10B981"
                                : "#6D5DFB",
                          },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        {
                          xs:
                            "repeat(2, 1fr)",

                          md:
                            "repeat(4, 1fr)",
                        },

                      gap: 2,

                      mt: 2.5,
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Objetivo
                      </Typography>

                      <Typography
                        fontWeight={700}
                      >
                        {formatearDinero(
                          objetivo
                        )}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Reservado
                      </Typography>

                      <Typography
                        fontWeight={700}
                      >
                        {formatearDinero(
                          reservado
                        )}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Pendiente
                      </Typography>

                      <Typography
                        fontWeight={700}
                      >
                        {formatearDinero(
                          pendiente
                        )}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Tiempo
                      </Typography>

                      <Typography
                        fontWeight={700}
                        color={
                          dias < 0 &&
                          !completado
                            ? "error.main"
                            : "text.primary"
                        }
                      >
                        {completado
                          ? "Listo"
                          : dias < 0
                            ? "Vencido"
                            : `${dias} días`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display:
                        "flex",

                      gap: 1,

                      flexWrap:
                        "wrap",

                      mt: 3,
                    }}
                  >
                    {!completado && (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() =>
                            sumarAhorro(
                              apartado,
                              semanal
                            )
                          }
                        >
                          + Apartado semanal
                        </Button>

                        <Button
                          variant="outlined"
                          onClick={() => {
                            const cantidad =
                              window.prompt(
                                "¿Cuánto deseas agregar al apartado?"
                              );

                            if (
                              cantidad
                            ) {
                              sumarAhorro(
                                apartado,
                                cantidad
                              );
                            }
                          }}
                        >
                          + Otra cantidad
                        </Button>
                      </>
                    )}

                    <Button
                      color="error"
                      onClick={() =>
                        eliminarApartado(
                          apartado.id
                        )
                      }
                    >
                      Eliminar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}

        {apartados.length ===
          0 && (
          <Card
            sx={{
              borderRadius:
                "24px",
            }}
          >
            <CardContent
              sx={{
                py: 6,
                textAlign:
                  "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 30,
                  mb: 1,
                }}
              >
                🪴
              </Typography>

              <Typography
                fontWeight={800}
              >
                Todavía no tienes
                apartados
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
                sx={{
                  mt: 0.5,
                }}
              >
                Crea uno para un
                gasto importante
                que llegará en el
                futuro.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}