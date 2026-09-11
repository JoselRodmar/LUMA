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

export default function Privacidad() {
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
              Aviso de Privacidad
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              Versión{" "}
              {
                LEGAL.versionPrivacidad
              }{" "}
              · Última actualización:{" "}
              {
                LEGAL.fechaActualizacion
              }
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Seccion titulo="1. Responsable">
              <Typography>
                <strong>
                  {LEGAL.responsable}
                </strong>
                , con domicilio en{" "}
                <strong>
                  {LEGAL.domicilio}
                </strong>
                , es responsable del
                tratamiento y protección
                de los datos personales
                utilizados en LUMA.
              </Typography>
            </Seccion>

            <Seccion titulo="2. Datos que tratamos">
              <Typography>
                LUMA puede tratar los
                datos que proporciones al
                crear y utilizar tu
                cuenta, incluyendo nombre,
                correo electrónico, país,
                moneda y preferencias de
                configuración.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                También tratamos la
                información financiera y
                patrimonial que tú
                decides registrar en la
                aplicación, como ingresos,
                gastos, movimientos,
                apartados, cantidades,
                categorías, conceptos y
                fechas.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                No solicitamos números de
                tarjetas bancarias,
                contraseñas bancarias ni
                credenciales de acceso a
                instituciones financieras
                en la versión actual de
                LUMA.
              </Typography>
            </Seccion>

            <Seccion titulo="3. Finalidades">
              <Typography>
                Tus datos se utilizan
                para crear y administrar
                tu cuenta, almacenar y
                organizar la información
                financiera que registres,
                realizar los cálculos y
                comparaciones mostrados
                en LUMA, mantener la
                seguridad del servicio,
                permitir recuperación de
                acceso y proporcionar las
                funciones que solicites.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                En esta versión beta no
                utilizamos tu información
                financiera para
                publicidad personalizada
                ni vendemos tus datos
                personales o financieros.
              </Typography>
            </Seccion>

            <Seccion titulo="4. Consentimiento para datos financieros">
              <Typography>
                Debido a que LUMA trata
                datos financieros o
                patrimoniales que tú
                decides proporcionar,
                solicitamos tu
                consentimiento expreso
                durante la creación de
                cuenta.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                LUMA registra la fecha y
                versión del aviso bajo la
                cual otorgaste dicho
                consentimiento.
              </Typography>
            </Seccion>

            <Seccion titulo="5. Proveedores tecnológicos">
              <Typography>
                LUMA utiliza servicios
                tecnológicos de Google
                Firebase para funciones
                como autenticación,
                almacenamiento de datos y
                alojamiento de la
                aplicación.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Cuando eliges iniciar
                sesión mediante Google,
                Google también procesa la
                información necesaria
                para autenticar tu
                identidad de acuerdo con
                sus propios términos y
                políticas.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Los proveedores que
                procesan información por
                cuenta de LUMA deberán
                hacerlo únicamente para
                prestar los servicios
                tecnológicos
                correspondientes.
              </Typography>
            </Seccion>

            <Seccion titulo="6. Seguridad">
              <Typography>
                Implementamos medidas
                técnicas orientadas a
                proteger la información
                almacenada en LUMA.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Cada cuenta utiliza
                autenticación individual
                y las reglas de seguridad
                de la base de datos
                restringen el acceso a
                los documentos
                pertenecientes al usuario
                autenticado.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Ningún sistema conectado
                a Internet puede
                garantizar seguridad
                absoluta, por lo que
                también recomendamos
                proteger las credenciales
                de acceso a tu cuenta.
              </Typography>
            </Seccion>

            <Seccion titulo="7. Derechos ARCO">
              <Typography>
                Puedes solicitar acceso,
                rectificación,
                cancelación u oposición
                respecto de tus datos
                personales, así como
                revocar tu consentimiento
                cuando legalmente
                proceda.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Para realizar una
                solicitud puedes escribir
                a:
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

              <Typography sx={{ mt: 2 }}>
                La solicitud deberá
                permitir identificar al
                titular y describir con
                claridad el derecho que
                desea ejercer.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Adicionalmente, LUMA
                ofrece dentro de Mi
                cuenta la posibilidad de
                eliminar permanentemente
                la cuenta y los datos
                financieros asociados a
                ella.
              </Typography>
            </Seccion>

            <Seccion titulo="8. Limitar el uso o divulgación">
              <Typography>
                Puedes solicitar
                limitaciones respecto del
                uso o divulgación de tus
                datos personales mediante
                el correo:
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

            <Seccion titulo="9. Conservación y eliminación">
              <Typography>
                Conservaremos los datos
                mientras tu cuenta se
                encuentre activa o
                mientras sean necesarios
                para proporcionar el
                servicio, salvo que exista
                una obligación legal que
                requiera conservar
                determinada información
                durante un plazo
                adicional.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                Al utilizar la función
                Eliminar mi cuenta, LUMA
                elimina los registros
                financieros asociados a
                tu usuario y posteriormente
                elimina tu cuenta de
                autenticación, sujeto a
                las obligaciones legales
                aplicables.
              </Typography>
            </Seccion>

            <Seccion titulo="10. Cambios a este aviso">
              <Typography>
                Podemos actualizar este
                Aviso de Privacidad cuando
                cambien las funciones de
                LUMA, los tratamientos de
                datos o las disposiciones
                aplicables.
              </Typography>

              <Typography sx={{ mt: 2 }}>
                La versión y fecha de
                actualización se
                mostrarán en esta misma
                sección. Cuando un cambio
                requiera un nuevo
                consentimiento, LUMA lo
                solicitará nuevamente
                antes de continuar con el
                tratamiento
                correspondiente.
              </Typography>
            </Seccion>

            <Divider sx={{ my: 4 }} />

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{
                lineHeight: 1.6,
              }}
            >
              Contacto de privacidad:{" "}
              {
                LEGAL.emailPrivacidad
              }
            </Typography>
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