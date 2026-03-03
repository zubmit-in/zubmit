export type ServiceType =
  | "CASE_STUDY"
  | "REPORT"
  | "PPT"
  | "LAB_MANUAL"
  | "HANDWRITTEN_ASSIGNMENT"
  | "NOTES"
  | "PROTOTYPE_FULL_STACK_WEBSITE"
  | "OTHER";

const basePrices: Record<ServiceType, number> = {
  CASE_STUDY: 200,
  REPORT: 230,
  PPT: 250,
  LAB_MANUAL: 300,
  HANDWRITTEN_ASSIGNMENT: 300,
  NOTES: 300,
  PROTOTYPE_FULL_STACK_WEBSITE: 1500,
  OTHER: 250,
};

export const serviceLabels: Record<ServiceType, string> = {
  CASE_STUDY: "Case Study",
  REPORT: "Report Writing",
  PPT: "PowerPoint Presentation",
  LAB_MANUAL: "Lab Manual",
  HANDWRITTEN_ASSIGNMENT: "Handwritten Assignment",
  NOTES: "Notes",
  PROTOTYPE_FULL_STACK_WEBSITE: "Prototype Full Stack Website",
  OTHER: "Other",
};

export const serviceDescriptions: Record<ServiceType, string> = {
  CASE_STUDY: "In-depth analysis with proper formatting and references",
  REPORT: "Well-structured reports with executive summary",
  PPT: "Professional slides with visual design",
  LAB_MANUAL: "Complete lab experiments with observations",
  HANDWRITTEN_ASSIGNMENT: "Neat handwritten assignments on ruled sheets",
  NOTES: "Comprehensive study notes and summaries",
  PROTOTYPE_FULL_STACK_WEBSITE: "Working full-stack web application prototype",
  OTHER: "Custom academic work as per your requirements",
};

export function getUrgencyMultiplier(hoursUntilDeadline: number): number {
  if (hoursUntilDeadline <= 6) return 2.5;
  if (hoursUntilDeadline <= 12) return 2.0;
  if (hoursUntilDeadline <= 24) return 1.5;
  if (hoursUntilDeadline <= 48) return 1.0;
  if (hoursUntilDeadline <= 72) return 0.9;
  return 0.85;
}

export function getUrgencyLabel(hoursUntilDeadline: number): string {
  if (hoursUntilDeadline <= 6) return "SUPER URGENT";
  if (hoursUntilDeadline <= 12) return "VERY URGENT";
  if (hoursUntilDeadline <= 24) return "URGENT";
  if (hoursUntilDeadline <= 48) return "NORMAL";
  if (hoursUntilDeadline <= 72) return "RELAXED";
  return "FLEXIBLE";
}

export function getUrgencyColor(hoursUntilDeadline: number): string {
  if (hoursUntilDeadline <= 24) return "text-red-500";
  if (hoursUntilDeadline <= 48) return "text-orange-500";
  return "text-green-500";
}

export function calculatePrice(
  serviceType: ServiceType,
  hoursUntilDeadline: number,
  pages?: number,
  slides?: number
): number {
  const base = basePrices[serviceType];
  const multiplier = getUrgencyMultiplier(hoursUntilDeadline);

  let quantity = 1;
  if (serviceType === "PPT" && slides && slides > 10) {
    quantity = Math.ceil(slides / 10);
  } else if (pages && pages > 5 && serviceType !== "PROTOTYPE_FULL_STACK_WEBSITE") {
    quantity = Math.ceil(pages / 5);
  }

  return Math.round(base * multiplier * quantity);
}

export function getAdvanceAmount(total: number): number {
  return Math.round(total * 0.4);
}

export function getFinalAmount(total: number): number {
  return Math.round(total * 0.6);
}

export function getStartingPrice(serviceType: ServiceType): number {
  return Math.round(basePrices[serviceType] * 0.85);
}
