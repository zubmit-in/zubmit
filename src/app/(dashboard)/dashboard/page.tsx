"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  FileText, Clock, CheckCircle2, Plus, ArrowRight, Wallet, Briefcase,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPrice, formatDate } from "@/lib/utils";
import { serviceLabels } from "@/lib/pricing";
import { pageEnter, fadeUp, staggerContainer } from "@/lib/motion";
import { useCountUp } from "@/hooks/useCountUp";

interface OrderSummary {
  id: string;
  subject: string;
  serviceType: string;
  status: string;
  totalPrice: number;
  deadline: string;
  createdAt: string;
}

interface DashboardStats {
  total: number;
  pending: number;
  delivered: number;
  totalSpent: number;
}

function StatCard({ icon: Icon, label, value, accent, index }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericValue = typeof value === 'number' ? value : 0;
  const isPrice = typeof value === 'string';
  const count = useCountUp(numericValue, 1400, isInView);

  const accentColors: Record<string, { glow: string; gradient: string; dim: string }> = {
    p: { glow: 'rgba(232,114,42,0.08)', gradient: 'rgba(232,114,42,0.5)', dim: 'var(--p-dim)' },
    s: { glow: 'rgba(255,184,48,0.07)', gradient: 'rgba(255,184,48,0.5)', dim: 'var(--s-dim)' },
    g: { glow: 'rgba(34,217,138,0.07)', gradient: 'rgba(34,217,138,0.5)', dim: 'var(--g-dim)' },
  };
  const c = accentColors[accent] || accentColors.p;

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      className="card card-hover relative overflow-hidden cursor-default"
      style={{ padding: '28px 26px' }}
    >
      {/* Corner decoration */}
      <div
        className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${c.glow} 0%, transparent 70%)` }}
      />
      {/* Top line */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: '1px', background: `linear-gradient(90deg, ${c.gradient} 50%, transparent)` }}
      />

      <div className="relative z-[1]">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center"
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: c.dim }}
          >
            <Icon className="h-[18px] w-[18px]" style={{ color: `var(--${accent})` }} />
          </div>
        </div>
        <p className="display" style={{ fontSize: 'clamp(32px, 8vw, 58px)', color: 'var(--t1)' }}>
          {isPrice ? (
            <>{value}</>
          ) : (
            <>{count}</>
          )}
        </p>
        <p
          className="font-outfit font-semibold uppercase mt-2"
          style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'var(--t3)' }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, delivered: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch { /* */ }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/orders?limit=5");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        const total = data.orders.length;
        const pending = data.orders.filter((o: OrderSummary) =>
          ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(o.status)
        ).length;
        const delivered = data.orders.filter((o: OrderSummary) =>
          ["DELIVERED", "COMPLETED"].includes(o.status)
        ).length;
        const totalSpent = data.orders.reduce(
          (sum: number, o: OrderSummary) => sum + o.totalPrice, 0
        );
        setStats({ total: data.total || total, pending, delivered, totalSpent });
      }
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const statCards = [
    { icon: FileText, label: "Total Orders", value: stats.total, accent: "p" },
    { icon: Clock, label: "Pending", value: stats.pending, accent: "s" },
    { icon: CheckCircle2, label: "Delivered", value: stats.delivered, accent: "g" },
    { icon: Wallet, label: "Total Spent", value: formatPrice(stats.totalSpent), accent: "p" },
  ];

  return (
    <motion.div {...pageEnter}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="display" style={{ fontSize: 'clamp(32px, 7vw, 56px)', color: 'var(--t2)' }}>Hey </span>
            <span className="display" style={{ fontSize: 'clamp(32px, 7vw, 56px)', color: 'var(--t1)' }}>{user?.firstName || "there"}</span>
            <span style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>&#x1F44B;</span>
          </div>
          <p className="font-outfit mt-2" style={{ fontSize: '15px', fontWeight: 300, color: 'var(--t2)' }}>
            Here&apos;s what&apos;s happening with your orders
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/order/new">
            <button className="btn btn-s">
              <Plus className="h-4 w-4" />
              Place New Order
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-11"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '28px 26px' }}>
              <div className="skel h-9 w-9 mb-3" style={{ borderRadius: '10px' }} />
              <div className="skel h-14 w-20 mb-2" />
              <div className="skel h-3 w-24" />
            </div>
          ))
        ) : (
          statCards.map((stat, i) => (
            <StatCard key={i} index={i} {...stat} />
          ))
        )}
      </motion.div>

      {/* Freelancer Banner */}
      {profile?.role === "worker" && (
        <div
          className="mt-6 flex items-center gap-4 flex-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(255,184,48,0.07), rgba(255,184,48,0.02))',
            border: '1px solid rgba(255,184,48,0.18)',
            borderLeft: '3px solid var(--s)',
            borderRadius: '16px',
            padding: '20px 24px',
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '42px', height: '42px', borderRadius: '11px',
              background: 'var(--s-dim)', border: '1px solid var(--s-border)',
              boxShadow: '0 0 16px var(--s-glow)',
            }}
          >
            <Briefcase className="h-5 w-5" style={{ color: 'var(--s)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-outfit font-bold text-[15px]" style={{ color: 'var(--t1)' }}>Freelancer Mode Active</p>
            <p className="font-outfit text-[13px]" style={{ color: 'var(--t2)' }}>Check available tasks and earnings</p>
          </div>
          <Link href="/earnings">
            <button
              className="btn btn-ghost"
              style={{ borderColor: 'var(--s-border)', color: 'var(--s)', fontSize: '13px', padding: '8px 16px' }}
            >
              View Earnings
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      )}

      {/* Recent Orders */}
      <div className="mt-11">
        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h2 className="font-outfit font-bold text-[22px] mt-1.5" style={{ color: 'var(--t1)' }}>Recent Orders</h2>
          </div>
          {orders.length > 0 && (
            <Link href="/orders" className="font-outfit text-[13px] font-medium hover:underline" style={{ color: 'var(--p-bright)' }}>
              View All <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 mt-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card flex items-center gap-4" style={{ padding: '18px 20px' }}>
                <div className="skel h-10 w-10" style={{ borderRadius: '10px' }} />
                <div className="flex-1 space-y-2">
                  <div className="skel h-4 w-48" />
                  <div className="skel h-3 w-32" />
                </div>
                <div className="skel h-6 w-20" style={{ borderRadius: '8px' }} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card mt-5 text-center" style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 40px)' }}>
            <div
              className="flex items-center justify-center mx-auto"
              style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'var(--p-dim)', border: '1px solid var(--p-border)',
                boxShadow: '0 0 30px var(--p-glow)',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              <FileText className="h-8 w-8" style={{ color: 'var(--p-bright)' }} />
            </div>
            <p className="display mt-6" style={{ fontSize: 'clamp(24px, 5vw, 36px)', color: 'var(--t3)' }}>NO ORDERS YET.</p>
            <p className="font-outfit text-sm mt-2" style={{ color: 'var(--t2)' }}>
              Place your first order and get it delivered before your deadline
            </p>
            <Link href="/order/new">
              <button className="btn btn-p mt-6">
                Place First Order
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-2 mt-5"
          >
            {orders.map((order) => (
              <motion.div key={order.id} variants={fadeUp}>
                <Link href={`/order/${order.id}`}>
                  <div
                    className="group relative flex items-center gap-4 cursor-pointer transition-all duration-250 rounded-xl overflow-hidden hover:bg-[rgba(232,114,42,0.03)]"
                    style={{ padding: '18px 20px', borderBottom: '1px solid var(--b1)' }}
                  >
                    {/* Left accent */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2.5px] transition-all duration-250"
                      style={{ background: 'var(--p)', boxShadow: '0 0 12px var(--p)', borderRadius: '0 2px 2px 0' }}
                    />

                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'var(--p-dim)', border: '1px solid rgba(232,114,42,0.2)',
                      }}
                    >
                      <FileText className="h-[18px] w-[18px]" style={{ color: 'var(--p-bright)' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-outfit font-semibold text-sm truncate" style={{ color: 'var(--t1)' }}>{order.subject}</p>
                      <p className="font-outfit text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
                        {serviceLabels[order.serviceType as keyof typeof serviceLabels] || order.serviceType} &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={order.status} />
                      <p className="mono text-xs mt-1" style={{ color: 'var(--t3)' }}>{formatPrice(order.totalPrice)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
