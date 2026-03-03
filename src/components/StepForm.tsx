"use client";

import { Progress } from "@/components/ui/progress";

interface StepFormProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepForm({ currentStep, totalSteps, stepLabels }: StepFormProps) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${
              i + 1 <= currentStep
                ? "text-brand-blue"
                : "text-[var(--muted)]"
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < currentStep
                  ? "bg-brand-blue text-white"
                  : i + 1 === currentStep
                  ? "bg-brand-blue text-white ring-4 ring-brand-blue/20"
                  : "bg-[var(--card)] border-2 border-[var(--card-border)]"
              }`}
            >
              {i + 1}
            </div>
            <span className="hidden sm:inline text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
      <Progress value={progress} />
    </div>
  );
}
