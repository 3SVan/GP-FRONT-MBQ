// src/utils/goToDashboardByRole.js
export function goToDashboardByRole(navigate, roles = []) {
  if (roles.includes("ADMIN")) return navigate("/admin", { replace: true });
  if (roles.includes("APPROVER")) return navigate("/approver", { replace: true });
  if (roles.includes("PROVIDER")) return navigate("/provider", { replace: true });
  return navigate("/login", { replace: true });
}
