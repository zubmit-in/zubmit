"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Clock,
  CheckCircle2,
  Loader2,
  FileText,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice, formatDate, getHoursUntilDeadline, getWhatsAppLink } from "@/lib/utils";
import { serviceLabels, getFinalAmount } from "@/lib/pricing";

interface OrderDetail {
  id: string;
  subject: string;
  serviceType: string;
  title: string;
  description: string;
  frontPageInfo: string | null;
  rollNo: string;
  degree: string;
  specialization: string | null;
  semester: number;
  deadline: string;
  totalPrice: number;
  advancePaid: number;
  finalPaid: number;
  status: string;
  deliveryType: string;
  watermarkFile: string | null;
  finalFile: string | null;
  referenceFile: string | null;
  createdAt: string;
}

const statusSteps = [
  { key: "PENDING", label: "Pending", icon: Clock },
  { key: "ASSIGNED", label: "Assigned", icon: FileText },
  { key: "IN_PROGRESS", label: "In Progress", icon: Loader2 },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load order.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle return from Cashfree checkout
  useEffect(() => {
    const cfOrderId = searchParams.get("cf_order_id");
    if (cfOrderId) {
      fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfOrderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({ title: "Payment Successful!", description: "Your payment has been confirmed." });
            fetchOrder();
          } else {
            toast({ title: "Payment Pending", description: "Your payment is being processed. It will be confirmed shortly." });
          }
        })
        .catch(() => {
          toast({ title: "Error", description: "Could not verify payment.", variant: "destructive" });
        })
        .finally(() => {
          // Clean URL
          window.history.replaceState({}, "", `/order/${params.id}`);
        });
    }
  }, [searchParams, params.id, toast, fetchOrder]);

  const handleFinalPayment = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, type: "FINAL" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to create payment");
      }

      if (data.paymentSessionId) {
        const { load } = await import("@cashfreepayments/cashfree-js");
        const cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "PRODUCTION" ? "production" : "sandbox" });
        cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
        });
      } else {
        throw new Error("Failed to get payment session");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate payment.";
      toast({ title: "Error", description: message, variant: "destructive" });
      setPaying(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const idx = statusSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-[var(--muted)] mb-6">This order doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const currentStepIdx = getStatusIndex(order.status);
  const hoursLeft = getHoursUntilDeadline(order.deadline);
  const remaining = getFinalAmount(order.totalPrice);
  const whatsappMessage = `Hi, I need help with Order #${order.id} (${order.subject})`;
  const whatsappLink = getWhatsAppLink(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX", whatsappMessage);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-clash font-bold">{order.subject}</h1>
          <p className="text-sm text-[var(--muted)]">Order #{order.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative overflow-x-auto pb-2">
            <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 bg-[var(--card-border)]" />
            <div
              className="absolute top-4 sm:top-5 left-0 h-0.5 bg-brand-blue transition-all duration-500"
              style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
            />
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <div key={step.key} className="relative flex flex-col items-center z-10 min-w-[56px]">
                  <div
                    className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isCompleted
                        ? "bg-brand-blue text-white"
                        : "bg-[var(--card)] border-2 border-[var(--card-border)] text-[var(--muted)]"
                    } ${isCurrent ? "ring-4 ring-brand-blue/20" : ""}`}
                  >
                    <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium text-center ${isCompleted ? "text-brand-blue" : "text-[var(--muted)]"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--muted)]">Service Type</p>
                <p className="text-sm font-medium">{serviceLabels[order.serviceType as keyof typeof serviceLabels] || order.serviceType}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Degree / Semester</p>
                <p className="text-sm font-medium">{order.degree}, Sem {order.semester}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Roll Number</p>
                <p className="text-sm font-medium">{order.rollNo}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Delivery Type</p>
                <p className="text-sm font-medium">{order.deliveryType}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Deadline</p>
                <p className={`text-sm font-medium ${hoursLeft <= 24 ? "text-red-500" : hoursLeft <= 48 ? "text-orange-500" : "text-green-500"}`}>
                  {formatDate(order.deadline)}
                  <span className="text-xs ml-1">({Math.round(hoursLeft)}h left)</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Title</p>
                <p className="text-sm font-medium">{order.title}</p>
              </div>
            </div>

            {order.frontPageInfo && (
              <div>
                <p className="text-xs text-[var(--muted)]">Front Page Info</p>
                <p className="text-sm">{order.frontPageInfo}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-[var(--muted)]">Description</p>
              <p className="text-sm whitespace-pre-wrap">{order.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Total Price</span>
                <span className="font-semibold">{formatPrice(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Advance Paid</span>
                <span className="text-green-500 font-medium">{formatPrice(order.advancePaid)}</span>
              </div>
              <div className="h-px bg-[var(--card-border)]" />
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Remaining</span>
                <span className="font-bold text-lg">{formatPrice(remaining)}</span>
              </div>

              {order.status === "DELIVERED" && order.finalPaid === 0 && (
                <Button
                  onClick={handleFinalPayment}
                  className="w-full mt-4"
                  variant="orange"
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {formatPrice(remaining)} to Get Original
                    </>
                  )}
                </Button>
              )}

              {order.status === "COMPLETED" && order.finalFile && (
                <a href={order.finalFile} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full mt-4" variant="success">
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>
                </a>
              )}

              {order.status === "DELIVERED" && order.watermarkFile && (
                <a href={order.watermarkFile} target="_blank" rel="noopener noreferrer" className="block mt-2">
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Preview (Watermarked)
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="success" className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Need Help? Chat on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
