export function buildOtherExtractedFields(listingData = {}) {
  const skipLabels = new Set([
    "Product Type",
    "Brand",
    "Brand (Canonical)",
    "Model",
    "Material",
    "Color",
    "Condition",
    "Features",
    "Title",
    "Category"
  ]);

  const fields = Object.entries(listingData || {})
    .filter(([key, value]) => {
      if (value == null) return false;
      if (!String(value).trim()) return false;
      return !skipLabels.has(String(key).trim());
    })
    .map(([key, value]) => `${key}: ${value}`);

  return fields.join("\\n");
}