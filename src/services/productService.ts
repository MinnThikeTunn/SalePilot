import { supabase } from "../utils/supabase";
import type { Product } from "../types";
import { getState, setClientProducts } from "./clientStore";

export async function getProducts(userId?: string): Promise<Product[]> {
  let targetId = userId?.trim();

  // If targetId is missing or default_shop, fallback to current authenticated user
  if (!targetId || targetId === "default_shop") {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        targetId = authData.user.id;
      }
    } catch {
      // ignore
    }
  }

  let rows: any[] = [];

  if (targetId) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`owner_id.eq.${targetId},shop_id.eq.${targetId}`)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        rows = data;
      } else {
        // Fallback: Query owner_id directly
        const { data: ownerData } = await supabase
          .from("products")
          .select("*")
          .eq("owner_id", targetId)
          .order("created_at", { ascending: false });
        if (ownerData && ownerData.length > 0) {
          rows = ownerData;
        }
      }
    } catch (e) {
      console.warn("[productService] Error querying products with targetId:", e);
    }
  }

  // Fallback: If still empty, check if authenticated user has products under their user ID
  if (rows.length === 0) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && authData.user.id !== targetId) {
        const { data: authProducts } = await supabase
          .from("products")
          .select("*")
          .or(`owner_id.eq.${authData.user.id},shop_id.eq.${authData.user.id}`)
          .order("created_at", { ascending: false });
        if (authProducts && authProducts.length > 0) {
          rows = authProducts;
        }
      }
    } catch {
      // ignore
    }
  }

  return rows.map((row) => ({
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
  if (!items || items.length === 0) return true;

  try {
    const isUuid = (val?: string) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));
    const validOwnerUuid = isUuid(userId) ? userId.trim() : null;

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);

      // 1. Attempt atomic SQL decrement via RPC if productId is provided
      if (item.productId) {
        try {
          const { error: rpcError } = await supabase.rpc("decrement_product_stock", {
            p_product_id: item.productId,
            p_quantity: qty,
            p_owner_id: validOwnerUuid,
          });
          if (!rpcError) {
            continue; // Successfully decremented atomically
          }
        } catch {
          // RPC unavailable (e.g. migration pending); proceed to fallback query
        }
      }

      // 2. Fallback direct update query
      let query = supabase.from("products").select("id, stock, owner_id");
      if (validOwnerUuid) {
        query = query.or(`owner_id.eq.${validOwnerUuid},shop_id.eq.${userId}`);
      } else if (userId && userId !== "default_shop") {
        query = query.eq("shop_id", userId);
      }

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
          .eq("id", prodRow.id);
      }
    }

    // 3. Synchronize clientStore state so UI and offline tools reflect deducted stock immediately
    try {
      const localState = getState();
      if (localState && Array.isArray(localState.products)) {
        const updated = localState.products.map((p) => {
          const matchedItem = items.find(
            (it) => (it.productId && it.productId === p.id) || (it.productName && it.productName === p.name)
          );
          if (matchedItem) {
            return { ...p, stock: Math.max(0, (p.stock || 0) - (Number(matchedItem.quantity) || 1)) };
          }
          return p;
        });
        setClientProducts(updated);
      }
    } catch {
      // ignore
    }

    return true;
  } catch (err) {
    console.warn("[productService] Exception deducting product stock in DB:", err);
    return false;
  }
}
