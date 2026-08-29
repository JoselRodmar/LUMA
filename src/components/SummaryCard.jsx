import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  formatearDinero,
} from "../utils/frecuencia";

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  background,
}) {
  return (
    <Card
      sx={{
        borderRadius: "24px",
        height: "100%",
        background:
          background || "#FFFFFF",
        border:
          "1px solid rgba(0,0,0,0.035)",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              backgroundColor:
                "rgba(255,255,255,.75)",
              fontSize: 22,
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          sx={{
            mt: 2,
            fontWeight: 800,
            fontSize: {
              xs: "1.7rem",
              md: "2rem",
            },
            color,
          }}
        >
          {formatearDinero(value)}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            color: "text.secondary",
            fontSize: 12,
          }}
        >
          equivalente semanal
        </Typography>
      </CardContent>
    </Card>
  );
}
