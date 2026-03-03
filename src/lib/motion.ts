import type { Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;
const bouncyEase = [0.34, 1.56, 0.64, 1] as const;

export const pageEnter = {
  initial: { opacity: 0, filter: 'blur(12px)', y: 16 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
  transition: { duration: 0.55, ease }
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease }
  }
}

export const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
  show: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.45, ease }
  }
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
}

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1, x: 0,
    transition: { duration: 0.5, ease }
  }
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: {
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: bouncyEase }
  }
}
