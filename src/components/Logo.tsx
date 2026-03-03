"use client";

import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { width: 100, height: 28 },
  md: { width: 130, height: 36 },
  lg: { width: 160, height: 44 },
};

export function Logo({ size = "md" }: LogoProps) {
  const { theme } = useTheme();
  const s = sizes[size];

  // Dark mode: white logo, Light mode: black logo
  const src = theme === "dark" ? "/zubmit.logo.png" : "/zubmit.logo1.png";

  return (
    <Image
      src={src}
      alt="Zubmit"
      width={s.width}
      height={s.height}
      className="object-contain"
      priority
    />
  );
}
