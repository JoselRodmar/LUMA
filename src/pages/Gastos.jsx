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

export default function Gastos() {
  const [tipo, setTipo] =
    useState("Fijo");

  const [lugar, setLugar] =
    useState("Casa");

  const [
    concepto,
    setConcepto,
  ] = useState("");

  const [monto, setMonto] =
    useState("");

  const [
    frecuencia,
    setFrecuencia,
  ] = useState("Mensual");

  const [gastos, setGastos] =
    useState([]);

  const cargarGastos =
    async () => {
      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "gastos"
            )
          );

        setGastos(
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
    cargarGastos();
  }, []);

  const guardarGasto =
    async () => {
      if (
        !concepto.trim() ||
        !monto
      )
        return;

      await addDoc(
        collection(
          db,
          "gastos"
        ),
        {
          tipo,
          lugar,
          concepto:
            concepto.trim(),
          monto:
            Number(monto),
          frecuencia,
          createdAt:
            serverTimestamp(),
        }
      );

      setConcepto("");
      setMonto("");

      cargarGastos();
    };

  const eliminarGasto =
    async (id) => {
      if (
        !window.confirm(
          "¿Eliminar este gasto?"
        )
      )
        return;

      await deleteDoc(
        doc(
          db,
          "gastos",
          id
        )
      );

      cargarGastos();
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
        Gastos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Organiza tus gastos
        fijos y variables.
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
            Nuevo gasto
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
              label="Tipo"
              value={tipo}
              onChange={(e) =>
                setTipo(
                  e.target.value
                )
              }
            >
              <MenuItem value="Fijo">
                Fijo
              </MenuItem>

              <MenuItem value="Variable">
                Variable
              </MenuItem>
            </TextField>

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
              label="Concepto"
              value={concepto}
              onChange={(e) =>
                setConcepto(
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
              sx={{
                gridColumn: {
                  md: "span 2",
                },
              }}
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
              guardarGasto
            }
          >
            Guardar gasto
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
                Tipo
              </TableCell>
              <TableCell>
                Lugar
              </TableCell>
              <TableCell>
                Concepto
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
            {gastos.map(
              (item) => (
                <TableRow
                  key={item.id}
                  hover
                >
                  <TableCell>
                    {item.tipo}
                  </TableCell>

                  <TableCell>
                    {item.lugar}
                  </TableCell>

                  <TableCell>
                    {
                      item.concepto
                    }
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
                        eliminarGasto(
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
