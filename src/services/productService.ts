import { supabase } from "../utils/supabase";
import type { Product } from "../types";

export async function getProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description || "",
    stock: row.stock || 0,
    image: row.image || "",
    varies: row.Varies || [],
    is_on_demand: row.is_on_demand || false,
    waiting_time: row.waiting_time ? String(row.waiting_time) : "",
    cost_price: row.cost_price !== undefined ? Number(row.cost_price) : 0,
    lead_time_days: row.lead_time_days !== undefined ? Number(row.lead_time_days) : 3,
    safety_stock_threshold: row.safety_stock_threshold !== undefined ? Number(row.safety_stock_threshold) : 5,
  }));
}

export async function upsertProduct(userId: string, product: Partial<Product> & { id?: string }): Promise<{ success: boolean; error?: string }> {
  const payload = {
    shop_id: userId,
    owner_id: userId,
    category: "General",
    name: product.name || "",
    price: product.price || 0,
    description: product.description || "",
    stock: product.stock || 0,
    image: product.image || "",
    Varies: product.varies || [],
    is_on_demand: product.is_on_demand || false,
    waiting_time: product.waiting_time ? parseInt(product.waiting_time) || 0 : 0,
    cost_price: product.cost_price !== undefined ? Number(product.cost_price) : 0,
    lead_time_days: product.lead_time_days !== undefined ? Number(product.lead_time_days) : 3,
    safety_stock_threshold: product.safety_stock_threshold !== undefined ? Number(product.safety_stock_threshold) : 5,
  };

  if (product.id) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.id)
      .eq("owner_id", userId);

    if (error) {
      console.error("Error updating product:", error);
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("products").insert({
      ...payload,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    if (error) {
      console.error("Error inserting product:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function deleteProduct(productId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("owner_id", userId);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function migrateProductsFromJson(userId: string, jsonProducts: Product[]): Promise<{ success: boolean; count: number }> {
  if (!jsonProducts || jsonProducts.length === 0) {
    return { success: true, count: 0 };
  }

  const productsToInsert = jsonProducts.map((p, idx) => ({
    id: p.id || `prod-${Date.now()}-${idx}`,
    shop_id: userId,
    owner_id: userId,
    category: "General",
    name: p.name,
    price: p.price,
    description: p.description,
    stock: p.stock,
    image: p.image,
    Varies: p.varies || [],
    is_on_demand: p.is_on_demand || false,
    waiting_time: p.waiting_time ? parseInt(p.waiting_time) || 0 : 0,
  }));

  const { error } = await supabase.from("products").insert(productsToInsert);

  if (error) {
    console.error("Error migrating products:", error);
    return { success: false, count: 0 };
  }

  return { success: true, count: jsonProducts.length };
}

export async function deductProductStock(
  userId: string,
  items: { productId?: string; productName?: string; quantity: number }[]
): Promise<boolean> {
  if (!userId || !items || items.length === 0) return true;

  try {
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      let query = supabase.from("products").select("id, stock").eq("owner_id", userId);
      if (item.productId) {
        query = query.eq("id", item.productId);
      } else if (item.productName) {
        query = query.eq("name", item.productName);
      } else {
        continue;
      }

      const { data: prodRow } = await query.maybeSingle();
      if (prodRow) {
        const currentStock = Math.max(0, Number(prodRow.stock) || 0);
        const newStock = Math.max(0, currentStock - qty);
        await supabase
          .from("products")
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq("id", prodRow.id)
          .eq("owner_id", userId);
      }
    }
    return true;
  } catch (err) {
    console.warn("[productService] Exception deducting product stock in DB:", err);
    return false;
  }
}
