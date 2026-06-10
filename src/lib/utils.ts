import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInCalendarDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "AED"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "—"
  }

  const num = typeof amount === "string" ? Number(amount) : amount

  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatNumber(
  n: number | string | null | undefined
): string {
  if (n === null || n === undefined || n === "") {
    return "—"
  }

  return new Intl.NumberFormat("en-AE").format(Number(n))
}

export function formatDate(
  date: Date | string | null | undefined
): string {
  if (date === null || date === undefined) {
    return "—"
  }

  return format(new Date(date), "dd MMM yyyy")
}

export function formatDateTime(
  date: Date | string | null | undefined
): string {
  if (date === null || date === undefined) {
    return "—"
  }

  return format(new Date(date), "dd MMM yyyy, HH:mm")
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function initials(name: string | null | undefined): string {
  if (!name || name.trim() === "") {
    return ""
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")
}

export function daysUntil(
  date: Date | string | null | undefined
): number | null {
  if (date === null || date === undefined) {
    return null
  }

  return differenceInCalendarDays(new Date(date), new Date())
}
