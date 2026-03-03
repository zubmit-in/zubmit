"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPrice, formatDate, getHoursUntilDeadline } from "@/lib/utils";
import { serviceLabels } from "@/lib/pricing";
import { pageEnter, fadeUp, staggerContainer } from "@/lib/motion";

interface Order {
  id: string;
  subject: string;
  serviceType: string;
  status: string;
  totalPrice: number;
  deadline: string;
  createdAt: string;
  title: string;
}

const tabs = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Completed" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=100");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((o) => {
          if (filter === "PENDING") return ["PENDING", "ASSIGNED"].includes(o.status);
          if (filter === "IN_PROGRESS") return o.status === "IN_PROGRESS";
          if (filter === "DELIVERED") return o.status === "DELIVERED";
          if (filter === "COMPLETED") return o.status === "COMPLETED";
          return true;
        });

  return (
    <motion.div {...pageEnter}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="eyebrow">ORDER TRACKER</span>
          <h1 className="display mt-2" style={{ fontSize: '52px', color: 'var(--t1)' }}>My Orders</h1>
          <p className="mt-1" style={{ fontSize: '14px', fontWeight: 300, color: 'var(--t3)' }}>
            {orders.length} total order{orders.length !== 1 ? "s" : ""}
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
              New Order
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Filter Tabs — underline style */}
      <div
        className="flex gap-1 mt-8 overflow-x-auto pb-px scrollbar-none"
        style={{ borderBottom: '1px solid var(--b1)' }}
      >
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="relative font-medium shrink-0 transition-colors"
              style={{
                fontSize: '13px',
                padding: '10px 18px',
                color: active ? 'var(--p-bright)' : 'var(--t3)',
              }}
            >
              {tab.label}
              {/* Active underline */}
              {active && (
                <motion.div
                  layoutId="orders-tab"
                  className="absolute bottom-0 left-2 right-2"
                  style={{
                    height: '2px',
                    background: 'var(--p)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '0 0 12px var(--p-glow)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4" style={{ padding: '18px 20px', borderBottom: '1px solid var(--b1)' }}>
              <div className="skel h-10 w-10" style={{ borderRadius: '10px' }} />
              <div className="flex-1 space-y-2">
                <div className="skel h-4 w-48" />
                <div className="skel h-3 w-32" />
              </div>
              <div className="skel h-6 w-20" style={{ borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card mt-6 text-center" style={{ padding: '80px 40px' }}>
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
          <p className="display mt-6" style={{ fontSize: '36px', color: 'var(--t3)' }}>
            {filter === "ALL" ? "NO ORDERS YET." : `NO ${filter.replace("_", " ")} ORDERS.`}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--t2)' }}>
            {filter === "ALL"
              ? "Place your first order and get it delivered before your deadline"
              : "Orders with this status will appear here"}
          </p>
          {filter === "ALL" && (
            <Link href="/order/new">
              <button className="btn btn-p mt-6">
                Place First Order
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mt-6"
          key={filter}
        >
          {filteredOrders.map((order) => {
            const hoursLeft = getHoursUntilDeadline(order.deadline);
            const urgent = hoursLeft > 0 && hoursLeft <= 12;
            const overdue = hoursLeft <= 0;

            return (
              <motion.div key={order.id} variants={fadeUp}>
                <Link href={`/order/${order.id}`}>
                  <div
                    className="group relative flex items-center gap-4 cursor-pointer transition-all duration-250 hover:bg-[rgba(232,114,42,0.03)]"
                    style={{ padding: '18px 20px', borderBottom: '1px solid var(--b1)' }}
                  >
                    {/* Left accent on hover */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2.5px] transition-all duration-250"
                      style={{ background: 'var(--p)', boxShadow: '0 0 12px var(--p)', borderRadius: '0 2px 2px 0' }}
                    />

                    {/* Icon */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'var(--p-dim)', border: '1px solid rgba(232,114,42,0.2)',
                      }}
                    >
                      <FileText className="h-[18px] w-[18px]" style={{ color: 'var(--p-bright)' }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--t1)' }}>{order.subject}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {/* Service chip */}
                        <span
                          className="mono"
                          style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--p-dim)',
                            color: 'var(--p-bright)',
                            border: '1px solid rgba(232,114,42,0.15)',
                          }}
                        >
                          {serviceLabels[order.serviceType as keyof typeof serviceLabels] || order.serviceType}
                        </span>
                        {/* Deadline */}
                        <span className="flex items-center gap-1" style={{
                          fontSize: '12px',
                          color: overdue ? 'var(--r)' : urgent ? 'var(--s)' : 'var(--t3)',
                        }}>
                          <Clock className="h-3 w-3" />
                          {overdue ? "Past deadline" : `${Math.round(hoursLeft)}h left`}
                        </span>
                        {/* Date */}
                        <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="text-right shrink-0">
                      <StatusBadge status={order.status} />
                      <p className="display mt-1" style={{ fontSize: '18px', color: 'var(--t1)' }}>
                        {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
