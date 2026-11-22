import { Link } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";

function NoEncontrado() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Error 404"
        title="Página no encontrada"
        description="La dirección que buscás no existe."
      />
      <Link className="primary-button" to="/">
        Volver al inicio
      </Link>
    </Layout>
  );
}

export default NoEncontrado;
