export type Kpis = {
  delivered: number
  late_orders: number
  on_time_pct: number // 0 to 1, not 0 to 100
  avg_order_value: number
  lead_days: number
  win_rate: number // 0 to 1
  revenue: number
  design_days: number
}

export type NameValue = { name: string; value: number }
export type ProfitRow = { name: string; avg_profit: number; orders: number }
export type TrendRow = { month: string; created: number; completed: number }

export type RevenueRow = { month: string; revenue: number; cost: number }

export type OnTimeRow = { month: string; on_time_pct: number | null; resignations: number }

export type Meta = { date_min: string; date_max: string; partial_last_month: boolean; products: string[] }
