export function formatConditionLabel(condition) {
  if (!condition || typeof condition !== "string") return "Unknown";

  return condition
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default formatConditionLabel;
