import { supabase } from "../utils/supabase";
import type { Order, OrderItem } from "../types";

export function mapDbRowToOrder(r: any): Order {
  return {
    id: r.id || `ord-${Date.now()}`,
    invoiceId: r.invoice_id || `INV-${String(r.id || Date.now()).slice(-6)}`,
    customerName: r.customer_name || "Guest Customer",
    customerPhone: r.customer_phone || "",
    customerTelegramId: r.customer_telegram_id || "public_chat_customer",
    township: r.township || "Yangon",
    addressDetails: r.address_details || "",
    deliveryFee: Math.max(0, Number(r.delivery_fee) || 0),
    paymentMethod: (r.payment_method === "prepay" ? "prepay" : "cod") as "cod" | "prepay",
    totalAmount: Math.max(0, Number(r.total_amount) || 0),
    status: r.status || "pending",
    items: Array.isArray(r.items) ? (r.items as OrderItem[]) : [],
    paymentDetails: r.payment_details || undefined,
    createdAt: r.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch all orders for a shop owner from the Supabase Postgres "orders" table.
 */
export async function getOrdersForOwner(ownerId: string, shopId?: string): Promise<Order[]> {
  try {
    let query = supabase.from("orders").select("*");

    if (ownerId && shopId) {
      query = query.or(`owner_id.eq.${ownerId},shop_id.eq.${shopId}`);
    } else if (ownerId) {
      query = query.eq("owner_id", ownerId);
    } else if (shopId) {
      query = query.eq("shop_id", shopId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("[ordersApi] Error fetching orders from DB:", error);
      return [];
    }

    return (data || []).map(mapDbRowToOrder);
  } catch (err) {
    console.warn("[ordersApi] Exception fetching orders:", err);
    return [];
  }
}

/**
 * Update order status in the Supabase Postgres "orders" table.
 */
export async function updateDbOrderStatus(orderId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .or(`id.eq.${orderId},invoice_id.eq.${orderId}`);

    if (error) {
      console.warn("[ordersApi] Error updating order status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ordersApi] Exception updating order status:", err);
    return false;
  }
}
