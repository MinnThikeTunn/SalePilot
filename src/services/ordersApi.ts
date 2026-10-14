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
export async function getOrdersForOwner(ownerId?: string, shopId?: string): Promise<Order[]> {
  try {
    const isUuid = (val?: string) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

    let query = supabase.from("orders").select("*");

    const validOwnerUuid = isUuid(ownerId) ? ownerId?.trim() : undefined;
    const textShopId = (shopId?.trim() || (!isUuid(ownerId) ? ownerId?.trim() : undefined)) || undefined;

    if (validOwnerUuid && textShopId) {
      query = query.or(`owner_id.eq.${validOwnerUuid},shop_id.eq.${textShopId}`);
    } else if (validOwnerUuid) {
      query = query.eq("owner_id", validOwnerUuid);
    } else if (textShopId && textShopId !== "default_shop") {
      query = query.eq("shop_id", textShopId);
    } else {
      // Fallback to authenticated user
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        query = query.eq("owner_id", authData.user.id);
      } else {
        return [];
      }
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
