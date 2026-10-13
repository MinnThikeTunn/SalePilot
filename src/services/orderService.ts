import { supabase } from "../utils/supabase";
import type { Order } from "../types";

export async function getOrders(userId: string): Promise<Order[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerTelegramId: row.customer_telegram_id || "",
    township: row.township,
    addressDetails: row.address_details || row.township || "",
    deliveryFee: row.delivery_fee || 0,
    paymentMethod: (row.payment_method?.toLowerCase() === "prepay" ? "prepay" : "cod") as "cod" | "prepay",
    totalAmount: row.total_amount || 0,
    status: row.status as "pending" | "verifying" | "confirmed" | "completed" | "cancelled",
    items: (row.items || []).map((item: any) => ({
      productId: item.productId || item.id || "",
      productName: item.productName || item.name || "Product",
      price: item.price || 0,
      quantity: item.quantity || 1,
    })),
    paymentDetails: row.payment_details || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  }));
}

export async function updateOrderStatusInDb(
  orderId: string,
  status: "confirmed" | "cancelled" | "completed" | "verifying" | "pending"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status in db:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

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
