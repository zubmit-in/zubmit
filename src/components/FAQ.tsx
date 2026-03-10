"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, HelpCircle, CreditCard, Truck, Users } from "lucide-react";

type Category = "General" | "Payments" | "Delivery" | "Freelancing";

const categoryIcons: Record<Category, React.ReactNode> = {
  General: <HelpCircle className="h-4 w-4" />,
  Payments: <CreditCard className="h-4 w-4" />,
  Delivery: <Truck className="h-4 w-4" />,
  Freelancing: <Users className="h-4 w-4" />,
};

const faqs: { category: Category; q: string; a: string }[] = [
  // General
  {
    category: "General",
    q: "What is Zubmit?",
    a: "Zubmit is a platform where students can get their college assignments completed easily and reliably. Our expert team manages the entire process including request matching, quality checks, and delivery.",
  },
  {
    category: "General",
    q: "How does it work?",
    a: "Place an order with your assignment details, pay a small advance, and our verified worker completes it before your deadline. You receive the completed work digitally or physically.",
  },
  {
    category: "General",
    q: "Is my identity kept confidential?",
    a: "Absolutely. Your personal details are never shared with the worker. Everything is handled securely through the platform.",
  },
  {
    category: "General",
    q: "What types of assignments do you handle?",
    a: "Case Studies, Reports, Lab Records, Handwritten Assignments, PPTs, Notes and more in both digital and physical formats.",
  },
  // Payments
  {
    category: "Payments",
    q: "How is the price calculated?",
    a: "Pricing depends on the service type, number of pages, and delivery urgency. You see the exact price breakdown before placing your order with no hidden charges.",
  },
  {
    category: "Payments",
    q: "How much advance do I need to pay?",
    a: "You pay 40% as advance when placing the order. The remaining 60% is paid after you receive the completed assignment.",
  },
  {
    category: "Payments",
    q: "What payment methods are accepted?",
    a: "We accept all major payment methods including UPI, debit cards, credit cards, and net banking through our secure payment gateway.",
  },
  // Delivery
  {
    category: "Delivery",
    q: "How do I receive my assignment?",
    a: "Digital assignments are delivered through the platform. Physical assignments are hand delivered by our delivery team directly to your location.",
  },
  {
    category: "Delivery",
    q: "Can I get my assignment done urgently?",
    a: "Yes, we accept urgent orders. Select your deadline while placing the order and pricing adjusts accordingly.",
  },
  {
    category: "Delivery",
    q: "What if I am not satisfied with the work?",
    a: "You get up to 3 free revisions per assignment. Our admin reviews every submission before delivery to ensure quality meets your expectations.",
  },
  // Freelancing
  {
    category: "Freelancing",
    q: "How can I earn as a freelancer?",
    a: "Go to the Earnings page, complete your freelancer profile, accept the terms, and start picking up available tasks. Payments are processed after admin approval.",
  },
  {
    category: "Freelancing",
    q: "When do freelancers get paid?",
    a: "Payment is processed after admin reviews and approves your submission, usually within 24 hours of approval via UPI.",
  },
  {
    category: "Freelancing",
    q: "Who can become a freelancer?",
    a: "Any verified university student can apply to become a freelancer. You need to complete your profile, agree to the terms, and pass the verification process.",
  },
];

const categories: Category[] = ["General", "Payments", "Delivery", "Freelancing"];

function FAQCard({
  q,
  a,
  isOpen,
  onClick,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${isOpen ? "var(--p)" : "var(--b1)"}`,
        borderRadius: "14px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: isOpen ? "0 0 20px rgba(232,114,42,0.08)" : "none",
      }}
      onClick={onClick}
    >
      <div
        className="font-outfit"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "20px 22px",
          gap: "14px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: isOpen ? "var(--t1)" : "var(--t2)",
            lineHeight: 1.5,
            transition: "color 0.3s ease",
          }}
        >
          {q}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isOpen ? "var(--p)" : "var(--hover-bg)",
            transition: "background 0.3s ease",
          }}
        >
          {isOpen ? (
            <X className="h-3.5 w-3.5" style={{ color: "#fff" }} />
          ) : (
            <Plus
              className="h-3.5 w-3.5"
              style={{ color: "var(--p)" }}
            />
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="font-outfit"
              style={{
                padding: "0 22px 20px",
                fontSize: "13px",
                color: "var(--t3)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState<Category>("General");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((f) => f.category === activeCategory);

  // Split into two columns
  const mid = Math.ceil(filteredFaqs.length / 2);
  const col1 = filteredFaqs.slice(0, mid);
  const col2 = filteredFaqs.slice(mid);

  return (
    <section id="faq" style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "48px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "32px",
              textAlign: "center",
            }}
          >
            <div>
              <span
                className="eyebrow"
                style={{ display: "inline-block", marginBottom: "12px" }}
              >
                GOT QUESTIONS?
              </span>
              <h2
                className="display"
                style={{
                  fontSize: "clamp(36px, 5vw, 52px)",
                  color: "var(--t1)",
                  marginBottom: "12px",
                }}
              >
                Frequently Asked{" "}
                <span style={{ color: "var(--p)" }}>Questions</span>
              </h2>
              <p
                className="font-outfit"
                style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.7 }}
              >
                Everything you need to know about Zubmit
              </p>
            </div>

            {/* Category Tabs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className="font-outfit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    border:
                      activeCategory === cat
                        ? "1px solid var(--p)"
                        : "1px solid var(--b1)",
                    background:
                      activeCategory === cat
                        ? "rgba(232,114,42,0.12)"
                        : "var(--card-bg)",
                    color:
                      activeCategory === cat ? "var(--p)" : "var(--t2)",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                >
                  {categoryIcons[cat]}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQ Grid (two columns) */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: "14px",
            alignItems: "start",
          }}
        >
          {/* Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {col1.map((faq, i) => {
              const globalIdx = i;
              return (
                <FAQCard
                  key={`${activeCategory}-${i}`}
                  q={faq.q}
                  a={faq.a}
                  isOpen={openIndex === globalIdx}
                  onClick={() =>
                    setOpenIndex(openIndex === globalIdx ? null : globalIdx)
                  }
                />
              );
            })}
          </div>

          {/* Column 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {col2.map((faq, i) => {
              const globalIdx = mid + i;
              return (
                <FAQCard
                  key={`${activeCategory}-${mid + i}`}
                  q={faq.q}
                  a={faq.a}
                  isOpen={openIndex === globalIdx}
                  onClick={() =>
                    setOpenIndex(openIndex === globalIdx ? null : globalIdx)
                  }
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


