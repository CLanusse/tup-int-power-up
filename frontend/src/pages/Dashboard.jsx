import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/useAuth";
import "../styles/app.css";

function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <PageHeader
        eyebrow="Resumen semanal"
        title={user?.nombre ? `Hola, ${user.nombre.split(" ")[0]}` : "Tu semana en movimiento"}
        description="Acá vas a ver tu actividad de la semana."
      />
    </Layout>
  );
}

export default Dashboard;
