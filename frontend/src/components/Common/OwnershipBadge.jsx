import { ownershipLabel } from "../../utils/permissions";

function OwnershipBadge({ resource, user }) {
  const label = ownershipLabel(resource, user);
  return (
    <span className={`ownership-badge ${label === "PowerUp" ? "is-global" : ""}`}>{label}</span>
  );
}

export default OwnershipBadge;
