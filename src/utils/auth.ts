export function isKitchenOnlyRole(role?: string | null) {
  return role === "operator" || role === "operor";
}
