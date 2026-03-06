"use client";

import {
  FileText,
  FileEdit,
  Presentation,
  PenTool,
  BookMarked,
  StickyNote,
  Globe,
  HelpCircle,
  Briefcase,
  ClipboardList,
  Building2,
  Ruler,
  Compass,
  Palette,
  ShieldCheck,
  Monitor,
  Lamp,
  Layers,
  Pipette,
} from "lucide-react";
import { serviceLabels, serviceDescriptions, getStartingPrice, type ServiceType } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";

const serviceIcons: Record<ServiceType, React.ReactNode> = {
  CASE_STUDY: <FileText className="h-6 w-6" />,
  REPORT: <FileEdit className="h-6 w-6" />,
  PPT: <Presentation className="h-6 w-6" />,
  LAB_RECORDS: <BookMarked className="h-6 w-6" />,
  HANDWRITTEN_ASSIGNMENT: <PenTool className="h-6 w-6" />,
  NOTES: <StickyNote className="h-6 w-6" />,
  PROTOTYPE_FULL_STACK_WEBSITE: <Globe className="h-6 w-6" />,
  INTERNSHIP_RESUME: <Briefcase className="h-6 w-6" />,
  SURVEY_REPORTS: <ClipboardList className="h-6 w-6" />,
  ARCHITECTURAL_VISUALIZATION: <Building2 className="h-6 w-6" />,
  ARCHITECTURAL_DRAFTING: <Ruler className="h-6 w-6" />,
  ARCHITECTURAL_DESIGN_DEVELOPMENT: <Compass className="h-6 w-6" />,
  INTERIOR_DESIGN_PORTFOLIO: <Palette className="h-6 w-6" />,
  BUILDING_CODES_REGULATIONS: <ShieldCheck className="h-6 w-6" />,
  INTERIOR_DESIGN_SOFTWARE_VISUALIZATION: <Monitor className="h-6 w-6" />,
  INTERIOR_STYLING_DECORATION: <Lamp className="h-6 w-6" />,
  MATERIALS_FINISHES_PROJECTS: <Layers className="h-6 w-6" />,
  COLOR_THEORY_APPLICATION: <Pipette className="h-6 w-6" />,
  OTHER: <HelpCircle className="h-6 w-6" />,
};

interface ServiceSelectorProps {
  selected: ServiceType | "";
  onSelect: (service: ServiceType) => void;
}

const serviceKeys: ServiceType[] = [
  "CASE_STUDY",
  "REPORT",
  "PPT",
  "NOTES",
  "LAB_RECORDS",
  "HANDWRITTEN_ASSIGNMENT",
  "PROTOTYPE_FULL_STACK_WEBSITE",
  "INTERNSHIP_RESUME",
  "SURVEY_REPORTS",
  "ARCHITECTURAL_VISUALIZATION",
  "ARCHITECTURAL_DRAFTING",
  "ARCHITECTURAL_DESIGN_DEVELOPMENT",
  "INTERIOR_DESIGN_PORTFOLIO",
  "BUILDING_CODES_REGULATIONS",
  "INTERIOR_DESIGN_SOFTWARE_VISUALIZATION",
  "INTERIOR_STYLING_DECORATION",
  "MATERIALS_FINISHES_PROJECTS",
  "COLOR_THEORY_APPLICATION",
];

export function ServiceSelector({ selected, onSelect }: ServiceSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {serviceKeys.map((key) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`p-5 rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? "border-brand-blue bg-brand-blue/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                : "border-[var(--card-border)] bg-[var(--card)]/80 hover:border-brand-blue/30"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? "bg-brand-blue text-white"
                    : "bg-brand-blue/10 text-brand-blue"
                }`}
              >
                {serviceIcons[key]}
              </div>
              <span className="text-xs font-medium text-[var(--muted)]">
                From {formatPrice(getStartingPrice(key))}
              </span>
            </div>
            <h4 className="font-semibold text-sm mb-1">{serviceLabels[key]}</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {serviceDescriptions[key]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
