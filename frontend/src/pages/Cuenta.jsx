import AccountDetails from "../components/Account/AccountDetails";
import { PasswordForm, ProfileForm } from "../components/Account/AccountForms";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import SuccessNotice from "../components/Feedback/SuccessNotice";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import { useProfile } from "../hooks/useProfile";
import "../styles/app.css";

function Cuenta() {
  const { profile, error, success, saveProfile, savePassword } = useProfile();

  return (
    <Layout>
      <PageHeader
        eyebrow="Perfil"
        title="Mi cuenta"
        description="Datos asociados a tu acceso de PowerUp."
      />
      <ErrorNotice message={error} />
      <SuccessNotice message={success} />
      <AccountDetails profile={profile} />
      {profile && (
        <>
          {/* key: si cambian los datos guardados, el formulario se reinicia con ellos. */}
          <ProfileForm
            key={`${profile.nombre}-${profile.email}`}
            profile={profile}
            onSave={saveProfile}
          />
          <PasswordForm onSave={savePassword} />
        </>
      )}
    </Layout>
  );
}

export default Cuenta;
