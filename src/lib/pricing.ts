export type ServiceType =
  | "CASE_STUDY"
  | "REPORT"
  | "PPT"
  | "LAB_RECORDS"
  | "HANDWRITTEN_ASSIGNMENT"
  | "NOTES"
  | "PROTOTYPE_FULL_STACK_WEBSITE"
  | "INTERNSHIP_RESUME"
  | "SURVEY_REPORTS"
  | "ARCHITECTURAL_VISUALIZATION"
  | "ARCHITECTURAL_DRAFTING"
  | "ARCHITECTURAL_DESIGN_DEVELOPMENT"
  | "INTERIOR_DESIGN_PORTFOLIO"
  | "BUILDING_CODES_REGULATIONS"
  | "INTERIOR_DESIGN_SOFTWARE_VISUALIZATION"
  | "INTERIOR_STYLING_DECORATION"
  | "MATERIALS_FINISHES_PROJECTS"
  | "COLOR_THEORY_APPLICATION"
  | "OTHER";

const basePrices: Record<ServiceType, number> = {
  CASE_STUDY: 200,
  REPORT: 230,
  PPT: 250,
  LAB_RECORDS: 300,
  HANDWRITTEN_ASSIGNMENT: 300,
  NOTES: 300,
  PROTOTYPE_FULL_STACK_WEBSITE: 1500,
  INTERNSHIP_RESUME: 249,
  SURVEY_REPORTS: 299,
  ARCHITECTURAL_VISUALIZATION: 349,
  ARCHITECTURAL_DRAFTING: 349,
  ARCHITECTURAL_DESIGN_DEVELOPMENT: 399,
  INTERIOR_DESIGN_PORTFOLIO: 199,
  BUILDING_CODES_REGULATIONS: 299,
  INTERIOR_DESIGN_SOFTWARE_VISUALIZATION: 349,
  INTERIOR_STYLING_DECORATION: 249,
  MATERIALS_FINISHES_PROJECTS: 399,
  COLOR_THEORY_APPLICATION: 199,
  OTHER: 250,
};

export const serviceLabels: Record<ServiceType, string> = {
  CASE_STUDY: "Case Study",
  REPORT: "Report Writing",
  PPT: "PowerPoint Presentation",
  LAB_RECORDS: "Lab Records",
  HANDWRITTEN_ASSIGNMENT: "Handwritten Assignment",
  NOTES: "Notes",
  PROTOTYPE_FULL_STACK_WEBSITE: "Prototype Full Stack Website",
  INTERNSHIP_RESUME: "Internship-Ready Resume",
  SURVEY_REPORTS: "Survey Reports",
  ARCHITECTURAL_VISUALIZATION: "Architectural Visualization",
  ARCHITECTURAL_DRAFTING: "Architectural Drafting",
  ARCHITECTURAL_DESIGN_DEVELOPMENT: "Architectural Design Development",
  INTERIOR_DESIGN_PORTFOLIO: "Interior Design Portfolio",
  BUILDING_CODES_REGULATIONS: "Building Codes & Regulations",
  INTERIOR_DESIGN_SOFTWARE_VISUALIZATION: "Interior Design Software & Visualization",
  INTERIOR_STYLING_DECORATION: "Interior Styling & Decoration",
  MATERIALS_FINISHES_PROJECTS: "Materials & Finishes Projects",
  COLOR_THEORY_APPLICATION: "Color Theory & Application",
  OTHER: "Other",
};

export const serviceDescriptions: Record<ServiceType, string> = {
  CASE_STUDY: "In-depth analysis with proper formatting and references",
  REPORT: "Well-structured reports with executive summary",
  PPT: "Professional slides with visual design",
  LAB_RECORDS: "Complete lab experiments with observations",
  HANDWRITTEN_ASSIGNMENT: "Neat handwritten assignments on ruled sheets",
  NOTES: "Comprehensive study notes and summaries",
  PROTOTYPE_FULL_STACK_WEBSITE: "Working full-stack web application prototype",
  INTERNSHIP_RESUME: "Professional, ATS-friendly resume tailored for internships with structured formatting and content optimization",
  SURVEY_REPORTS: "Well-structured survey reports including data presentation, analysis, and proper formatting as per academic guidelines",
  ARCHITECTURAL_VISUALIZATION: "Rendered views, sheet presentation, design composition, and graphical enhancement for architectural projects",
  ARCHITECTURAL_DRAFTING: "Technical drawings including plans, sections, elevations, and detailed drafting as per academic requirements",
  ARCHITECTURAL_DESIGN_DEVELOPMENT: "Concept development, planning, and structured architectural design solutions for academic submissions",
  INTERIOR_DESIGN_PORTFOLIO: "Professional portfolio layout with curated projects, clean presentation, and structured formatting",
  BUILDING_CODES_REGULATIONS: "Detailed assignments covering building safety standards, fire and electrical regulations, accessibility guidelines, and local building laws",
  INTERIOR_DESIGN_SOFTWARE_VISUALIZATION: "AutoCAD drafting, 3D modeling, SketchUp designs, Photoshop render enhancements, and virtual walkthrough presentations",
  INTERIOR_STYLING_DECORATION: "Decor themes, accessories, soft furnishings, seasonal styling concepts, and aesthetic enhancement with visual presentation",
  MATERIALS_FINISHES_PROJECTS: "Flooring systems, wall treatments, ceiling designs, and usage of materials such as wood, metal, glass, fabric, and sustainable alternatives",
  COLOR_THEORY_APPLICATION: "Color psychology, harmony, combinations, lighting impact on colors, and practical application in interior spaces",
  OTHER: "Custom academic work as per your requirements",
};

/**
 * Urgency surcharge — capped at ₹200 max.
 * Applied once per order based on deadline proximity.
 */
export function getUrgencySurcharge(hoursUntilDeadline: number): number {
  if (hoursUntilDeadline <= 6) return 200;
  if (hoursUntilDeadline <= 12) return 150;
  if (hoursUntilDeadline <= 24) return 100;
  if (hoursUntilDeadline <= 48) return 50;
  return 0;
}

/**
 * Page surcharge for a single service — NO cap.
 * Kicks in when pages > 35 for that service.
 * Adds ₹20 per 10-page block beyond 35.
 */
export function getPageSurcharge(pages: number): number {
  if (pages <= 35) return 0;
  return Math.ceil((pages - 35) / 10) * 20;
}

/**
 * Order-level surcharge: urgency (capped at ₹200) + page surcharges (no cap).
 * servicePages is an array of page counts, one per service in the order.
 */
export function calculateOrderSurcharge(servicePages: number[], hoursUntilDeadline: number): number {
  const urgency = getUrgencySurcharge(hoursUntilDeadline);
  const pageSurcharge = servicePages.reduce((sum, p) => sum + getPageSurcharge(p), 0);
  return urgency + pageSurcharge;
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

/**
 * Returns the base price for a service. Surcharges are calculated at the
 * order level via calculateOrderSurcharge().
 */
export function calculatePrice(serviceType: ServiceType): number {
  return basePrices[serviceType];
}

export function getAdvanceAmount(total: number): number {
  return Math.round(total * 0.4);
}

export function getFinalAmount(total: number): number {
  return Math.round(total * 0.6);
}

export function getStartingPrice(serviceType: ServiceType): number {
  return basePrices[serviceType];
}
