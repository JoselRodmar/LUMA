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
} from "firebase/firestore";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  db,
} from "../services/firebase";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

const frecuencias = [
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bimestral",
  "Semestral",
  "Anual",
];

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

export default function Ingresos() {
  const [lugar, setLugar] =
    useState("Casa");

  const [nombre, setNombre] =
    useState("");

  const [monto, setMonto] =
    useState("");

  const [
    frecuencia,
    setFrecuencia,
  ] = useState("Mensual");

  const [
    ingresos,
    setIngresos,
  ] = useState([]);

  const cargarIngresos =
    async () => {
      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "ingresos"
            )
          );

        setIngresos(
          snapshot.docs.map(
            (documento) => ({
              id:
                documento.id,
              ...documento.data(),
            })
          )
        );
      } catch (error) {
        console.error(error);
      }
    };

  useEffect(() => {
    cargarIngresos();
  }, []);

  const guardarIngreso =
    async () => {
      if (
        !nombre.trim() ||
        !monto
      )
        return;

      await addDoc(
        collection(
          db,
          "ingresos"
        ),
        {
          lugar,
          nombre:
            nombre.trim(),
          monto:
            Number(monto),
          frecuencia,
          createdAt:
            serverTimestamp(),
        }
      );

      setNombre("");
      setMonto("");

      cargarIngresos();
    };

  const eliminarIngreso =
    async (id) => {
      if (
        !window.confirm(
          "¿Eliminar este ingreso?"
        )
      )
        return;

      await deleteDoc(
        doc(
          db,
          "ingresos",
          id
        )
      );

      cargarIngresos();
    };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 4,
        },

        maxWidth: 1300,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: 32,
          fontWeight: 800,
        }}
      >
        Ingresos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Registra el dinero
        que entra a tus
        diferentes espacios.
      </Typography>

      <Card
        sx={{
          borderRadius:
            "24px",
          mb: 3,
        }}
      >
        <CardContent
          sx={{ p: 3 }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              mb: 3,
            }}
          >
            Nuevo ingreso
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                {
                  xs: "1fr",
                  md:
                    "repeat(2,1fr)",
                },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Lugar"
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
              label="Nombre"
              value={nombre}
              onChange={(e) =>
                setNombre(
                  e.target.value
                )
              }
            />

            <TextField
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) =>
                setMonto(
                  e.target.value
                )
              }
            />

            <TextField
              select
              label="Frecuencia"
              value={
                frecuencia
              }
              onChange={(e) =>
                setFrecuencia(
                  e.target.value
                )
              }
            >
              {frecuencias.map(
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
          </Box>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={
              guardarIngreso
            }
          >
            Guardar ingreso
          </Button>
        </CardContent>
      </Card>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius:
            "24px",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Lugar
              </TableCell>
              <TableCell>
                Nombre
              </TableCell>
              <TableCell>
                Monto
              </TableCell>
              <TableCell>
                Frecuencia
              </TableCell>
              <TableCell>
                Semanal
              </TableCell>
              <TableCell>
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {ingresos.map(
              (item) => (
                <TableRow
                  key={item.id}
                  hover
                >
                  <TableCell>
                    {item.lugar}
                  </TableCell>

                  <TableCell>
                    {item.nombre}
                  </TableCell>

                  <TableCell>
                    {formatearDinero(
                      item.monto
                    )}
                  </TableCell>

                  <TableCell>
                    {
                      item.frecuencia
                    }
                  </TableCell>

                  <TableCell>
                    {formatearDinero(
                      calcularSemanal(
                        item.monto,
                        item.frecuencia
                      )
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      color="error"
                      onClick={() =>
                        eliminarIngreso(
                          item.id
                        )
                      }
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
