import { AtSign, Calendar, ShieldCheck, UserRound } from "lucide-react";

const ROLE_LABELS = {
  usuario: "Usuario",
  admin: "Administrador",
};

function AccountDetails({ profile }) {
  return (
    <section className="account-layout">
      <div className="account-avatar" aria-hidden="true">
        <UserRound size={38} />
        <strong>{profile?.nombre?.slice(0, 1).toUpperCase() || "-"}</strong>
      </div>
      <div className="content-section account-details">
        <div className="account-row">
          <UserRound size={19} />
          <span>Nombre</span>
          <strong>{profile?.nombre || "Cargando..."}</strong>
        </div>
        <div className="account-row">
          <AtSign size={19} />
          <span>Correo</span>
          <strong>{profile?.email || "Cargando..."}</strong>
        </div>
        <div className="account-row">
          <ShieldCheck size={19} />
          <span>Rol</span>
          <strong>{ROLE_LABELS[profile?.rol] || "-"}</strong>
        </div>
        {profile?.createdAt && (
          <div className="account-row">
            <Calendar size={19} />
            <span>Miembro desde</span>
            <strong>{new Date(profile.createdAt).toLocaleDateString("es-AR")}</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountDetails;
