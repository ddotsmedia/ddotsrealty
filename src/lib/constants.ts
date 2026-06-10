export interface OptionItem {
  value: string
  label: string
}

export const EMIRATES = [
  { value: "abu_dhabi", label: "Abu Dhabi" },
  { value: "dubai", label: "Dubai" },
  { value: "sharjah", label: "Sharjah" },
  { value: "ajman", label: "Ajman" },
  { value: "umm_al_quwain", label: "Umm Al Quwain" },
  { value: "ras_al_khaimah", label: "Ras Al Khaimah" },
  { value: "fujairah", label: "Fujairah" },
] as const

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "land", label: "Land" },
  { value: "building", label: "Building" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
] as const

export const PROPERTY_PURPOSES = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
  { value: "both", label: "Rent or Sale" },
] as const

export const PROPERTY_STATUSES = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "sold", label: "Sold" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "off_market", label: "Off Market" },
] as const

export const PRICE_FREQUENCIES = [
  { value: "yearly", label: "/ year" },
  { value: "monthly", label: "/ month" },
  { value: "weekly", label: "/ week" },
  { value: "daily", label: "/ day" },
  { value: "total", label: "total" },
] as const

export const CONTRACT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "pending_renewal", label: "Pending Renewal" },
] as const

export const PAYMENT_MODES = [
  { value: "cheques", label: "Cheques" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "mixed", label: "Mixed" },
] as const

export const CHEQUE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "deposited", label: "Deposited" },
  { value: "cleared", label: "Cleared" },
  { value: "bounced", label: "Bounced" },
  { value: "replaced", label: "Replaced" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const LISTING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
] as const

export const LISTING_TYPES = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
] as const

export const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "portal", label: "Portal" },
  { value: "social", label: "Social Media" },
] as const

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "viewing", label: "Viewing" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const

export const LEAD_ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "viewing", label: "Viewing" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
] as const

export const MAINTENANCE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "ac", label: "A/C" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "cleaning", label: "Cleaning" },
  { value: "pest_control", label: "Pest Control" },
  { value: "other", label: "Other" },
] as const

export const MAINTENANCE_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const

export const MAINTENANCE_STATUSES = [
  { value: "reported", label: "Reported" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const TRANSACTION_TYPES = [
  { value: "rent_income", label: "Rent Income" },
  { value: "commission", label: "Commission" },
  { value: "maintenance_cost", label: "Maintenance Cost" },
  { value: "refund", label: "Refund" },
  { value: "deposit", label: "Deposit" },
  { value: "other", label: "Other" },
] as const

export const COMMISSION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
] as const

export const DOC_TYPES = [
  { value: "trade_license", label: "Trade License" },
  { value: "rera_card", label: "RERA Card" },
  { value: "ejari", label: "Ejari" },
  { value: "tawtheeq", label: "Tawtheeq" },
  { value: "title_deed", label: "Title Deed" },
  { value: "passport", label: "Passport" },
  { value: "emirates_id", label: "Emirates ID" },
  { value: "contract", label: "Contract" },
  { value: "noc", label: "NOC" },
  { value: "oqood", label: "Oqood" },
  { value: "invoice", label: "Invoice" },
  { value: "other", label: "Other" },
] as const

export const COMMUNITIES: readonly string[] = [
  "Dubai Marina",
  "Jumeirah Beach Residence",
  "Downtown Dubai",
  "Business Bay",
  "Jumeirah Lake Towers",
  "Palm Jumeirah",
  "Dubai Hills Estate",
  "Arabian Ranches",
  "Jumeirah Village Circle",
  "Dubai Silicon Oasis",
  "Mirdif",
  "Deira",
  "Al Barsha",
  "Al Reem Island",
  "Yas Island",
  "Saadiyat Island",
  "Al Raha Beach",
  "Khalifa City",
  "Al Reef",
  "Corniche",
  "Al Khalidiyah",
  "Masdar City",
  "Al Nahyan",
  "Mohammed Bin Zayed City",
]

export function labelOf(
  list: readonly OptionItem[],
  value: string | null | undefined
): string {
  if (!value) return value ?? ""
  return list.find((item) => item.value === value)?.label ?? value
}

// Status Variants
export const CHEQUE_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending: "warning",
  deposited: "info",
  cleared: "success",
  bounced: "danger",
  replaced: "muted",
  cancelled: "muted",
}

export const PROPERTY_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  available: "success",
  rented: "info",
  sold: "muted",
  under_maintenance: "warning",
  off_market: "muted",
}

export const CONTRACT_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  active: "success",
  expired: "danger",
  terminated: "muted",
  pending_renewal: "warning",
}

export const LEAD_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  new: "info",
  contacted: "info",
  qualified: "info",
  viewing: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
}

export const LISTING_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  draft: "muted",
  active: "success",
  paused: "warning",
  expired: "danger",
  sold: "muted",
  rented: "info",
}

export const MAINTENANCE_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  reported: "info",
  approved: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "muted",
}

export const MAINTENANCE_PRIORITY_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  low: "muted",
  medium: "info",
  high: "warning",
  urgent: "danger",
}

export const TRANSACTION_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
  refunded: "muted",
}

export const TRANSACTION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const

export const PAYMENT_METHODS = [
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
] as const

export const COMMISSION_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending: "warning",
  approved: "info",
  paid: "success",
}

export const COMMISSION_DEAL_TYPES = [
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Sale" },
] as const
