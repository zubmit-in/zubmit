"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { X, ArrowRight, Star } from "lucide-react";
import "swiper/css";

type FilterType = "ALL" | "DIGITAL" | "PHYSICAL";

interface PortfolioItem {
  id: number;
  title: string;
  type: FilterType;
  label: string;
  pages: string;
  grade: string;
  image: string;
}

const portfolioItems: PortfolioItem[] = [
  { id: 1, title: "Physics Case Study", type: "DIGITAL", label: "Case Study", pages: "30 Pages", grade: "A+", image: "/portfolio/digital1.jpeg" },
  { id: 2, title: "Physics Case Study", type: "DIGITAL", label: "Report", pages: "30 Pages", grade: "A+", image: "/portfolio/digital2.jpeg" },
  { id: 3, title: "Physics Case Study", type: "DIGITAL", label: "Case Study", pages: "30 Pages", grade: "A+", image: "/portfolio/digital3.jpeg" },
  { id: 4, title: "Chemistry Lab Records", type: "PHYSICAL", label: "Lab Records", pages: "50 Pages", grade: "A+", image: "/portfolio/physical1.jpeg" },
  { id: 5, title: "Physics Case Study", type: "DIGITAL", label: "Report", pages: "30 Pages", grade: "A+", image: "/portfolio/digital4.jpeg" },
  { id: 6, title: "Chemistry Lab Records", type: "PHYSICAL", label: "Lab Records", pages: "50 Pages", grade: "A+", image: "/portfolio/physical2.jpeg" },
  { id: 7, title: "Physics Case Study", type: "DIGITAL", label: "Case Study", pages: "30 Pages", grade: "A+", image: "/portfolio/digital5.jpeg" },
  { id: 8, title: "Chemistry Lab Records", type: "PHYSICAL", label: "Lab Records", pages: "50 Pages", grade: "A+", image: "/portfolio/physical3.jpeg" },
  { id: 9, title: "Physics Case Study", type: "DIGITAL", label: "Report", pages: "30 Pages", grade: "A+", image: "/portfolio/digital6.jpeg" },
];

const filters: { key: FilterType; label: string }[] = [
  { key: "ALL", label: "All Work" },
  { key: "DIGITAL", label: "Digital Assignments" },
  { key: "PHYSICAL", label: "Physical Assignments" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export function Portfolio() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);

  const filteredItems = activeFilter === "ALL"
    ? portfolioItems
    : portfolioItems.filter((item) => item.type === activeFilter);

  const closePreview = useCallback(() => setPreviewItem(null), []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (previewItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [previewItem]);

  return (
    <>
      <section id="portfolio" style={{ padding: "120px 0" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp}>
              <span className="eyebrow justify-center" style={{ color: "#ff6b2b" }}>OUR WORK</span>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-4">
              <h2 className="display" style={{ fontSize: "clamp(36px, 5vw, 52px)", color: "var(--t1)" }}>
                Real Assignments{" "}
                <span style={{ color: "#ff6b2b" }}>Delivered</span>
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-4 mx-auto max-w-[480px] text-sm" style={{ color: "var(--t2)" }}>
              Trusted by students. Here are real assignment samples completed by Zubmit.
            </motion.p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  background: activeFilter === f.key ? "#ff6b2b" : "transparent",
                  color: activeFilter === f.key ? "#fff" : "var(--t2)",
                  border: `1px solid ${activeFilter === f.key ? "#ff6b2b" : "rgba(255,255,255,0.2)"}`,
                  boxShadow: activeFilter === f.key ? "0 0 20px rgba(255,107,43,0.4)" : "none",
                }}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Swiper Carousel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <Swiper
              key={activeFilter}
              modules={[Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              loop={filteredItems.length > 3}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="portfolio-swiper"
            >
              {filteredItems.map((item) => (
                <SwiperSlide key={item.id}>
                  <div
                    onClick={() => setPreviewItem(item)}
                    className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Grade badge */}
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(0,0,0,0.8)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {item.grade}
                      </div>
                      {/* Overlay on hover */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                      >
                        <span
                          className="text-white text-sm font-semibold px-5 py-2.5 rounded-full"
                          style={{ background: "#ff6b2b", boxShadow: "0 0 24px rgba(255,107,43,0.5)" }}
                        >
                          View Details
                        </span>
                      </div>
                    </div>

                    {/* Card Info — black bg, white & orange text */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            background: "rgba(255,107,43,0.15)",
                            color: "#ff6b2b",
                            border: "1px solid rgba(255,107,43,0.3)",
                          }}
                        >
                          {item.label}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{item.pages}</span>
                      </div>
                      <h3 className="font-semibold text-sm" style={{ color: "#fff" }}>{item.title}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </section>

      {/* Preview Modal — fullscreen scrollable */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center overflow-y-auto"
            style={{ zIndex: 200, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", paddingTop: "80px", paddingBottom: "40px" }}
            onClick={closePreview}
          >
            {/* Fixed close button — always visible top-right */}
            <button
              onClick={closePreview}
              className="fixed flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={{
                top: "20px",
                right: "20px",
                zIndex: 210,
                width: "44px",
                height: "44px",
                background: "#ff6b2b",
                color: "#fff",
                boxShadow: "0 0 20px rgba(255,107,43,0.5)",
              }}
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full mx-4"
              style={{ maxWidth: "600px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image — full, no crop, with border */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#000",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 0 40px rgba(0,0,0,0.6)",
                }}
              >
                <Image
                  src={previewItem.image}
                  alt={previewItem.title}
                  width={600}
                  height={800}
                  className="w-full h-auto"
                  style={{ display: "block" }}
                />
              </div>

              {/* Info card below image */}
              <div
                className="rounded-2xl mt-4 p-5"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: "rgba(255,107,43,0.15)",
                      color: "#ff6b2b",
                      border: "1px solid rgba(255,107,43,0.3)",
                    }}
                  >
                    {previewItem.label}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{previewItem.pages}</span>
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#fbbf24" }}>
                    <Star className="h-3 w-3 fill-current" />
                    {previewItem.grade}
                  </span>
                </div>

                <h3 className="font-bold text-lg" style={{ color: "#fff" }}>{previewItem.title}</h3>
                <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                  Real assignment sample completed by Zubmit. Quality verified by our team.
                </p>

                <Link href="/signup" className="inline-block mt-4">
                  <button
                    className="flex items-center gap-2 font-semibold text-sm rounded-full transition-all duration-300 hover:brightness-110"
                    style={{
                      padding: "12px 24px",
                      background: "#ff6b2b",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(255,107,43,0.4)",
                    }}
                  >
                    Order Similar Assignment
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
