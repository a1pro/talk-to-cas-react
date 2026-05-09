export function isFoodBusiness(businessType?: string | null): boolean {
  return ["restaurant", "takeaway", "cafe"].includes((businessType || "").toLowerCase());
}

export function getVoucherRangeForBusiness(businessType?: string | null) {
  if (isFoodBusiness(businessType)) {
    return {
      min: 2,
      max: 10,
      defaultValue: 5,
      label: "Restaurants / takeaway / cafe: £2 - £10",
    };
  }

  return {
    min: 5,
    max: 10,
    defaultValue: 5,
    label: "Clubs / bars: £5 - £10",
  };
}

export function clampVoucherAmount(value: number, businessType?: string | null): number {
  const range = getVoucherRangeForBusiness(businessType);
  return Math.min(range.max, Math.max(range.min, value));
}
