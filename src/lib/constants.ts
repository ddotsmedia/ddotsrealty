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
  { value: "collected", label: "Collected" },
  { value: "in_custody", label: "In Custody" },
  { value: "with_owner", label: "With Owner" },
  { value: "pending_deposit", label: "Pending Deposit" },
  { value: "deposited", label: "Deposited" },
  { value: "cleared", label: "Cleared" },
  { value: "bounced", label: "Bounced" },
  { value: "replaced", label: "Replaced" },
  { value: "postponed", label: "Postponed" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
  { value: "stale", label: "Stale" },
] as const

export const CHEQUE_DIRECTIONS = [
  { value: "receivable", label: "Receivable (from tenant)" },
  { value: "payable", label: "Payable (to owner)" },
] as const

export const SECURITY_DEPOSIT_STATUSES = [
  { value: "held", label: "Held" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "fully_refunded", label: "Fully Refunded" },
  { value: "forfeited", label: "Forfeited" },
] as const

export const SECURITY_DEPOSIT_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  held: "info",
  partially_refunded: "warning",
  fully_refunded: "success",
  forfeited: "danger",
}

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
  collected: "info",
  in_custody: "info",
  with_owner: "info",
  pending_deposit: "warning",
  deposited: "info",
  cleared: "success",
  bounced: "danger",
  replaced: "muted",
  postponed: "warning",
  returned: "muted",
  cancelled: "muted",
  stale: "danger",
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

export const VISA_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expired", label: "Expired" },
  { value: "in_process", label: "In Process" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const VISA_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  valid: "success",
  expired: "danger",
  in_process: "warning",
  cancelled: "muted",
}

export const SALARY_RANGES = [
  { value: "below_5k", label: "Below 5,000" },
  { value: "5k_10k", label: "5,000–10,000" },
  { value: "10k_20k", label: "10,000–20,000" },
  { value: "20k_50k", label: "20,000–50,000" },
  { value: "above_50k", label: "Above 50,000" },
] as const

export const SCREENING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "waived", label: "Waived" },
] as const

export const SCREENING_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  waived: "muted",
}

export const OCCUPANT_RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "domestic_help", label: "Domestic Help" },
  { value: "other", label: "Other" },
] as const

export const INSPECTION_TYPES = [
  { value: "move_in", label: "Move In" },
  { value: "move_out", label: "Move Out" },
  { value: "periodic", label: "Periodic" },
  { value: "complaint", label: "Complaint" },
] as const

export const INSPECTION_CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
] as const

export const INSPECTION_CONDITION_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  excellent: "success",
  good: "success",
  fair: "warning",
  poor: "danger",
}

export const INSPECTION_ROOMS = [
  { value: "living_room", label: "Living Room" },
  { value: "bedroom_master", label: "Master Bedroom" },
  { value: "bedroom_2", label: "Bedroom 2" },
  { value: "bedroom_3", label: "Bedroom 3" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom_master", label: "Master Bathroom" },
  { value: "bathroom_2", label: "Bathroom 2" },
  { value: "bathroom_3", label: "Bathroom 3" },
  { value: "balcony", label: "Balcony" },
  { value: "entrance", label: "Entrance" },
  { value: "store", label: "Store" },
  { value: "laundry", label: "Laundry" },
  { value: "garage", label: "Garage" },
  { value: "garden", label: "Garden" },
  { value: "common_area", label: "Common Area" },
  { value: "other", label: "Other" },
] as const

export const INSPECTION_ITEM_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing" },
] as const

export const INSPECTION_ITEM_CONDITION_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  new: "success",
  good: "success",
  fair: "warning",
  damaged: "danger",
  missing: "danger",
}

export const UTILITY_TYPES = [
  { value: "dewa", label: "DEWA" },
  { value: "aadc", label: "AADC" },
  { value: "sewa", label: "SEWA" },
  { value: "fewa", label: "FEWA" },
  { value: "internet", label: "Internet" },
  { value: "gas", label: "Gas" },
  { value: "chiller", label: "Chiller" },
] as const

export const UTILITY_STATUSES = [
  { value: "pending_activation", label: "Pending Activation" },
  { value: "active", label: "Active" },
  { value: "pending_deactivation", label: "Pending Deactivation" },
  { value: "deactivated", label: "Deactivated" },
  { value: "clearance_pending", label: "Clearance Pending" },
  { value: "cleared", label: "Cleared" },
] as const

export const UTILITY_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending_activation: "warning",
  active: "success",
  pending_deactivation: "warning",
  deactivated: "muted",
  clearance_pending: "warning",
  cleared: "info",
}

export const PARKING_TYPES = [
  { value: "covered", label: "Covered" },
  { value: "uncovered", label: "Uncovered" },
  { value: "basement", label: "Basement" },
  { value: "valet", label: "Valet" },
] as const

export const COMMUNICATION_CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "portal", label: "Portal" },
  { value: "in_person", label: "In Person" },
] as const

export const COMMUNICATION_DIRECTIONS = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
] as const

export const NOC_TYPES = [
  { value: "subletting", label: "Subletting" },
  { value: "renovation", label: "Renovation" },
  { value: "pet", label: "Pet" },
  { value: "satellite_dish", label: "Satellite Dish" },
  { value: "business_activity", label: "Business Activity" },
  { value: "visa_sponsorship", label: "Visa Sponsorship" },
  { value: "parking", label: "Parking" },
  { value: "move_in", label: "Move In" },
  { value: "move_out", label: "Move Out" },
  { value: "other", label: "Other" },
] as const

export const NOC_STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const

export const NOC_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  requested: "info",
  under_review: "warning",
  approved: "success",
  rejected: "danger",
}

export const ANNOUNCEMENT_TARGETS = [
  { value: "all", label: "All Tenants" },
  { value: "building", label: "By Building" },
  { value: "community", label: "By Community" },
  { value: "specific_tenants", label: "Specific Tenants" },
] as const

export const CLEARANCE_STATUSES = [
  { value: "in_progress", label: "In Progress" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "pending_inspection", label: "Pending Inspection" },
  { value: "pending_dewa", label: "Pending DEWA" },
  { value: "pending_ejari", label: "Pending Ejari" },
  { value: "completed", label: "Completed" },
] as const

export const CLEARANCE_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  in_progress: "info",
  pending_payment: "warning",
  pending_inspection: "warning",
  pending_dewa: "warning",
  pending_ejari: "warning",
  completed: "success",
}

export const SETTLEMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "settled", label: "Settled" },
] as const

export const SETTLEMENT_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  pending: "warning",
  partial: "warning",
  settled: "success",
}

export const DEPOSIT_REFUND_METHODS = [
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
] as const
