import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  LEGAL,
} from "../config/legal";

export default function Terminos() {
  const navigate =
    useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#F6F7FB",
        p: {
          xs: 2,
          sm: 3,
          md: 5,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#6D5DFB",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              LUMA
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={11}
              sx={{
                letterSpacing: 1.4,
              }}
            >
              FINANZAS CLARAS · BETA
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() =>
              navigate(-1)
            }
          >
            Volver
          </Button>
        </Box>

        <Card
          sx={{
            borderRadius: "28px",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                md: 5,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: 27,
                  md: 34,
                },
                fontWeight: 900,
              }}
            >
              Términos de Uso
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Versión{" "}
              {
                LEGAL.versionTerminos
              }{" "}
              · Última actualización:{" "}
              {
                LEGAL.fechaActualizacion
              }
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Seccion titulo="1. El servicio">
              <Typography>
                LUMA es una herramienta
                digital diseñada para
                ayudar a las personas a
                registrar, organizar y
                visualizar información
                relacionada con sus
                finanzas personales.
              </Typography>
            </Seccion>

            <Seccion titulo="2. Versión beta">
              <Typography>
                LUMA se encuentra
                actualmente en una etapa
                beta. Durante este periodo
                algunas funciones pueden
                cambiar, mejorarse,
                suspenderse o presentar
                errores mientras
                continuamos desarrollando
                el producto.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Los usuarios de beta
                pueden proporcionar
                comentarios y sugerencias
                para mejorar la
                aplicación.
              </Typography>
            </Seccion>

            <Seccion titulo="3. Cuenta">
              <Typography>
                Para utilizar las
                funciones privadas de
                LUMA necesitas crear una
                cuenta o autenticarte
                mediante un método
                disponible.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Eres responsable de
                mantener bajo control tus
                credenciales y de las
                actividades realizadas
                desde tu cuenta.
              </Typography>
            </Seccion>

            <Seccion titulo="4. Información registrada">
              <Typography>
                Tú decides qué
                información financiera
                registrar en LUMA y eres
                responsable de la
                exactitud de los datos
                ingresados.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                LUMA realiza cálculos a
                partir de dicha
                información, por lo que
                los resultados dependen
                directamente de los datos
                que proporciones.
              </Typography>
            </Seccion>

            <Seccion titulo="5. LUMA no proporciona asesoría financiera">
              <Typography>
                La información, cálculos,
                proyecciones,
                comparaciones y
                recomendaciones mostradas
                por LUMA tienen fines
                organizativos e
                informativos.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                No constituyen asesoría
                financiera, contable,
                fiscal, jurídica o de
                inversión y no sustituyen
                la evaluación de un
                profesional calificado
                cuando ésta sea
                necesaria.
              </Typography>
            </Seccion>

            <Seccion titulo="6. Uso permitido">
              <Typography>
                No debes utilizar LUMA
                para intentar obtener
                acceso a cuentas ajenas,
                vulnerar sistemas,
                introducir software
                malicioso, interferir con
                el funcionamiento del
                servicio o realizar
                actividades ilícitas.
              </Typography>
            </Seccion>

            <Seccion titulo="7. Disponibilidad">
              <Typography>
                Trabajamos para mantener
                LUMA disponible y
                funcional, pero al ser un
                servicio tecnológico no
                podemos garantizar
                disponibilidad
                ininterrumpida o ausencia
                absoluta de errores.
              </Typography>
            </Seccion>

            <Seccion titulo="8. Eliminación de cuenta">
              <Typography>
                Puedes solicitar o
                ejecutar la eliminación
                de tu cuenta mediante las
                herramientas disponibles
                dentro de LUMA.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Una vez confirmado el
                proceso de eliminación,
                la información eliminada
                puede no ser recuperable.
              </Typography>
            </Seccion>

            <Seccion titulo="9. Privacidad">
              <Typography>
                El tratamiento de datos
                personales realizado por
                LUMA se encuentra
                descrito en el Aviso de
                Privacidad disponible
                dentro de la aplicación.
              </Typography>
            </Seccion>

            <Seccion titulo="10. Cambios">
              <Typography>
                Estos Términos pueden
                actualizarse conforme
                evolucione LUMA.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Cuando una modificación
                requiera una nueva
                aceptación, se solicitará
                al usuario antes de
                continuar utilizando las
                funciones
                correspondientes.
              </Typography>
            </Seccion>

            <Seccion titulo="11. Legislación aplicable">
              <Typography>
                Estos Términos serán
                interpretados conforme a
                las disposiciones
                aplicables de los Estados
                Unidos Mexicanos, sin
                perjuicio de los derechos
                que la legislación
                aplicable reconozca a los
                usuarios.
              </Typography>
            </Seccion>

            <Seccion titulo="12. Contacto">
              <Typography>
                Para consultas
                relacionadas con
                privacidad o datos
                personales puedes
                contactar a:
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  color: "#6D5DFB",
                }}
              >
                {
                  LEGAL.emailPrivacidad
                }
              </Typography>
            </Seccion>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function Seccion({
  titulo,
  children,
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        sx={{
          fontSize: 19,
          fontWeight: 900,
          mb: 1.5,
        }}
      >
        {titulo}
      </Typography>

      <Box
        sx={{
          color: "text.secondary",
          lineHeight: 1.7,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}