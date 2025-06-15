import { Paper, Container } from "@mui/material";
import ProfileData from "../components/dashboard/ProfileData";

export default async function Dashboard() {
  return (
    <Container
      maxWidth="lg"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: 8,
        backgroundColor: "grey.100",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          pb: 6,
          borderRadius: 3,
          backgroundColor: "background.paper",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <ProfileData />
      </Paper>
    </Container>
  );
}
