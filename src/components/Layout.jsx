import {
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

const drawerWidth = 250;

const menu = [
  {
    nombre: "Dashboard",
    ruta: "/",
    icono: "✨",
  },
  {
    nombre: "Ingresos",
    ruta: "/ingresos",
    icono: "💰",
  },
  {
    nombre: "Gastos",
    ruta: "/gastos",
    icono: "🧾",
  },
  {
    nombre: "Apartados",
    ruta: "/apartados",
    icono: "🎯",
  },
];

export default function Layout({
  children,
}) {
  const location =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const drawer = (
    <Box
      sx={{
        height: "100%",
        px: 2,
        py: 2,
      }}
    >
      <Box
        sx={{
          height: 75,
          display: "flex",
          alignItems: "center",
          px: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 26,
              letterSpacing:
                "-1px",
              color: "#6D5DFB",
            }}
          >
            LUMA
          </Typography>

          <Typography
            sx={{
              fontSize: 11,
              color:
                "text.secondary",
              letterSpacing: 1,
            }}
          >
            FINANZAS CLARAS
          </Typography>
        </Box>
      </Box>

      <List>
        {menu.map(
          (item) => {
            const activo =
              location.pathname ===
              item.ruta;

            return (
              <ListItem
                key={
                  item.ruta
                }
                disablePadding
                sx={{
                  mb: 0.7,
                }}
              >
                <ListItemButton
                  component={
                    Link
                  }
                  to={
                    item.ruta
                  }
                  onClick={() =>
                    setMobileOpen(
                      false
                    )
                  }
                  sx={{
                    borderRadius:
                      "14px",

                    backgroundColor:
                      activo
                        ? "#EEEAFE"
                        : "transparent",

                    color:
                      activo
                        ? "#6D5DFB"
                        : "#565D6D",

                    "&:hover":
                      {
                        backgroundColor:
                          "#F3F1FF",
                      },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      fontSize: 20,
                    }}
                  >
                    {
                      item.icono
                    }
                  </Box>

                  <ListItemText
                    primary={
                      item.nombre
                    }
                    primaryTypographyProps={{
                      fontWeight:
                        activo
                          ? 700
                          : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }
        )}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight:
          "100vh",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: {
            md: "none",
          },

          backgroundColor:
            "rgba(255,255,255,.95)",

          color:
            "#1E2330",

          borderBottom:
            "1px solid #EEEFF3",
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() =>
              setMobileOpen(
                true
              )
            }
          >
            ☰
          </IconButton>

          <Typography
            sx={{
              ml: 1,
              fontWeight: 800,
              color:
                "#6D5DFB",
            }}
          >
            LUMA
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: {
            md: drawerWidth,
          },

          flexShrink: {
            md: 0,
          },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() =>
            setMobileOpen(
              false
            )
          }
          ModalProps={{
            keepMounted:
              true,
          }}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper":
              {
                width:
                  drawerWidth,
              },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: {
              xs: "none",
              md: "block",
            },

            "& .MuiDrawer-paper":
              {
                width:
                  drawerWidth,

                boxSizing:
                  "border-box",

                borderRight:
                  "1px solid #EEEFF3",

                backgroundColor:
                  "#FFFFFF",
              },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          width: {
            md:
              `calc(100% - ${drawerWidth}px)`,
          },

          backgroundColor:
            "#F6F7FB",

          minHeight:
            "100vh",

          pt: {
            xs: 10,
            md: 0,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}