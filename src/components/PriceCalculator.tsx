"use client";

import { useMemo } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  calculatePrice,
  calculateOrderSurcharge,
  getAdvanceAmount,
  getFinalAmount,
  getUrgencyLabel,
  getUrgencyColor,
  type ServiceType,
} from "@/lib/pricing";
import { formatPrice, getHoursUntilDeadline } from "@/lib/utils";

interface PriceCalculatorProps {
  serviceType: ServiceType;
  deadline: string;
  pages?: number;
  slides?: number;
}

export function PriceCalculator({
  serviceType,
  deadline,
  pages,
  slides,
}: PriceCalculatorProps) {
  const pricing = useMemo(() => {
    if (!deadline) return null;

    const hours = getHoursUntilDeadline(deadline);
    if (hours <= 0) return null;

    const base = calculatePrice(serviceType);
    const svcPages = serviceType === "PPT" ? (slides || 0) : (pages || 0);
    const surcharge = calculateOrderSurcharge([svcPages], hours);
    const total = base + surcharge;
    const advance = getAdvanceAmount(total);
    const final_ = getFinalAmount(total);
    const urgency = getUrgencyLabel(hours);
    const urgencyColorClass = getUrgencyColor(hours);

    return { total, advance, final: final_, urgency, urgencyColorClass, hours };
  }, [serviceType, deadline, pages, slides]);

  if (!pricing) {
    return (
      <Card className="border-[var(--card-border)]">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-[var(--muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--muted)]">
            Select a deadline to see pricing
          </p>
        </CardContent>
      </Card>
    );
  }

  const borderColor =
    pricing.hours <= 24
      ? "border-red-500/50"
      : pricing.hours <= 48
      ? "border-orange-500/50"
      : "border-green-500/50";

  return (
    <Card className={`${borderColor} transition-colors`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-clash font-semibold">Price Estimate</h3>
          <Badge
            variant={
              pricing.hours <= 24
                ? "destructive"
                : pricing.hours <= 48
                ? "warning"
                : "success"
            }
          >
            {pricing.urgency}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className={`h-4 w-4 ${pricing.urgencyColorClass}`} />
          <span className={pricing.urgencyColorClass}>
            {Math.round(pricing.hours)} hours until deadline
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Total Price</span>
            <span className="font-bold text-lg">{formatPrice(pricing.total)}</span>
          </div>
          <div className="h-px bg-[var(--card-border)]" />
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Advance (40%)</span>
            <span className="text-brand-blue font-semibold">
              {formatPrice(pricing.advance)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">On Delivery (60%)</span>
            <span>{formatPrice(pricing.final)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
