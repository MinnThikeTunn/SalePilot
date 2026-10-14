import type { Order } from "../types";
import {
  getOrdersForOwner,
  updateDbOrderStatus,
  updateDbOrderPaymentDetails,
  mapDbRowToOrder,
} from "./ordersApi";
import { supabase } from "../utils/supabase";

export { mapDbRowToOrder, updateDbOrderPaymentDetails };

/**
 * Fetch orders for owner.
 * Re-routes to single canonical ordersApi.ts source of truth.
 */
export async function getOrders(userId: string): Promise<Order[]> {
  return getOrdersForOwner(userId);
}

/**
 * Update order status.
 * Re-routes to single canonical ordersApi.ts source of truth.
 */
export async function updateOrderStatusInDb(
  orderId: string,
  status: "confirmed" | "cancelled" | "completed" | "verifying" | "pending"
): Promise<{ success: boolean; error?: string }> {
  const success = await updateDbOrderStatus(orderId, status);
  return { success };
}

/**
 * Scoped realtime subscription for a specific merchant's orders.
 */
export function subscribeToOrders(userId: string, onUpdate: () => void): () => void {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`orders_realtime_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `owner_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
