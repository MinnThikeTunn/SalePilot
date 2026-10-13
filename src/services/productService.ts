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
