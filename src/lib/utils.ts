import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getHoursUntilDeadline(deadline: Date | string): number {
  const now = new Date();
  const dl = new Date(deadline);
  return Math.max(0, (dl.getTime() - now.getTime()) / (1000 * 60 * 60));
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  const masked = user.slice(0, 2) + "***" + user.slice(-1);
  return `${masked}@${domain}`;
}

export function getWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
