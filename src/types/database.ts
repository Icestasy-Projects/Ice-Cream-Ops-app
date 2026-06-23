export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface RmStockRow {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  weekly_usage: number | null;
  weeks_of_stock: number | null;
  status: 'ok' | 'low' | 'critical' | null;
}

export interface PrepStockRow {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
  qty_total: number;
  reorder_point: number | null;
  weekly_usage: number | null;
  status: 'ok' | 'low' | 'critical' | null;
}

export interface FgStockRow {
  fg_product_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  weekly_usage: number | null;
  weeks_of_stock: number | null;
  status: 'ok' | 'low' | 'critical' | null;
}

export interface RmPlanningRow {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  qty_to_order: number | null;
  weekly_usage: number | null;
  status: string | null;
}

export interface PrepPlanningRow {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
  qty_total: number;
  reorder_point: number | null;
  qty_to_make: number | null;
  weekly_usage: number | null;
  status: string | null;
}

export interface FgPlanningRow {
  fg_product_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  qty_to_make: number | null;
  weekly_usage: number | null;
  status: string | null;
}

export interface ReplenishmentRmRow {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number;
  qty_to_order: number;
}

export interface ReplenishmentPrepRow {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_total: number;
  reorder_point: number;
  qty_to_make: number;
}

export interface ReplenishmentFgRow {
  fg_product_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number;
  qty_to_make: number;
}

export interface Ingredient {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  reorder_point: number | null;
}

export interface PrepProduct {
  prep_product_id: number;
  product_name: string;
  unit: string;
  default_batch_size: number | null;
}

export interface FgProduct {
  fg_product_id: number;
  product_name: string;
  unit: string;
}

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
}

export interface SalesOrder {
  order_id: number;
  order_ref: string;
  customer_name: string;
  order_date: string;
}

export interface StaffProfile {
  id: string;
  display_name: string;
  email: string;
  role: string | null;
}
