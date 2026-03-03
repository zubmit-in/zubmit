"use client";

import Link from "next/link";
import { FileText, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPrice, formatDate, getHoursUntilDeadline } from "@/lib/utils";
import { serviceLabels } from "@/lib/pricing";

interface OrderCardProps {
  order: {
    id: string;
    subject: string;
    serviceType: string;
    status: string;
    totalPrice: number;
    deadline: string;
    createdAt: string;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const hoursLeft = getHoursUntilDeadline(order.deadline);

  return (
    <Link href={`/order/${order.id}`}>
      <Card className="hover:border-brand-blue/30 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{order.subject}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {serviceLabels[order.serviceType as keyof typeof serviceLabels] || order.serviceType}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {hoursLeft > 0 ? `${Math.round(hoursLeft)}h left` : "Past deadline"}
                </span>
                <span className="text-xs font-medium">{formatPrice(order.totalPrice)}</span>
                <span className="text-xs text-[var(--muted)]">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
