export type { Role } from "@/lib/permissions"

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "default"

export interface PaginatedInput {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}
