import { DeliveryZone, DeliveryMatrixResponse, DeliveryZoneFormData } from "../types";
import * as ls from "./deliveryMatrixLocalStorage";
import { supabase } from "../utils/supabase";
import { getState, setClientDeliveryZones } from "./clientStore";

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function fetchDeliveryMatrix(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  _address: string = ""
): Promise<DeliveryMatrixResponse> {
  const userId = await getAuthUserId();

  if (userId) {
    try {
      let query = supabase
        .from("delivery_zones")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.ilike("township_name", `%${search.trim()}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        if (data.length > 0) {
          const mapped: DeliveryZone[] = data.map((z: any) => ({
            id: z.id,
            township_name: z.township_name,
            region: z.region || "",
            division: z.division || "",
            rate: Math.max(0, Number(z.rate) || 0),
            estimated_transit_timeline: z.estimated_transit_timeline || "1-2 Days",
            created_at: z.created_at,
          }));

          setClientDeliveryZones(mapped);

          const totalRecords = mapped.length;
          const totalPages = Math.ceil(totalRecords / limit) || 1;
          const offset = (page - 1) * limit;
          const pagedData = mapped.slice(offset, offset + limit);

          return {
            data: pagedData,
            pagination: {
              total_records: totalRecords,
              current_page: page,
              limit,
              total_pages: totalPages,
              has_next: page < totalPages,
              has_prev: page > 1,
            },
          };
        } else {
          // If Supabase has 0 rows, check if localStorage has zones to migrate
          const localState = getState();
          if (Array.isArray(localState.deliveryZones) && localState.deliveryZones.length > 0) {
            for (const zone of localState.deliveryZones) {
              await supabase.from("delivery_zones").insert({
                owner_id: userId,
                shop_id: userId,
                township_name: zone.township_name,
                rate: Number(zone.rate) || 0,
                estimated_transit_timeline: zone.estimated_transit_timeline || "1-2 Days",
                region: zone.region || "",
                division: zone.division || "",
              });
            }

            const { data: migrated } = await supabase
              .from("delivery_zones")
              .select("*")
              .eq("owner_id", userId)
              .order("created_at", { ascending: false });

            if (migrated && migrated.length > 0) {
              const mapped: DeliveryZone[] = migrated.map((z: any) => ({
                id: z.id,
                township_name: z.township_name,
                region: z.region || "",
                division: z.division || "",
                rate: Math.max(0, Number(z.rate) || 0),
                estimated_transit_timeline: z.estimated_transit_timeline || "1-2 Days",
                created_at: z.created_at,
              }));
              setClientDeliveryZones(mapped);
              const totalRecords = mapped.length;
              const totalPages = Math.ceil(totalRecords / limit) || 1;
              return {
                data: mapped.slice((page - 1) * limit, page * limit),
                pagination: {
                  total_records: totalRecords,
                  current_page: page,
                  limit,
                  total_pages: totalPages,
                  has_next: page < totalPages,
                  has_prev: page > 1,
                },
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("fetchDeliveryMatrix Supabase fallback:", e);
    }
  }

  return ls.fetchDeliveryMatrixLS(page, limit, search);
}

export async function addDeliveryZone(zone: DeliveryZoneFormData): Promise<DeliveryZone> {
  const userId = await getAuthUserId();
  let createdZone: DeliveryZone | null = null;

  if (userId) {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
          owner_id: userId,
          shop_id: userId,
          township_name: zone.township_name,
          rate: Number(zone.rate) || 0,
          estimated_transit_timeline: zone.estimated_transit_timeline || "1-2 Days",
          region: zone.region || "",
          division: zone.division || "",
        })
        .select()
        .single();

      if (!error && data) {
        createdZone = {
          id: data.id,
          township_name: data.township_name,
          region: data.region || "",
          division: data.division || "",
          rate: Math.max(0, Number(data.rate) || 0),
          estimated_transit_timeline: data.estimated_transit_timeline || "1-2 Days",
          created_at: data.created_at,
        };
      }
    } catch (e) {
      console.warn("addDeliveryZone Supabase error, falling back:", e);
    }
  }

  const localZone = await ls.addDeliveryZoneLS(zone);
  return createdZone || localZone;
}

export async function updateDeliveryZone(
  id: string,
  zone: Partial<DeliveryZoneFormData>
): Promise<DeliveryZone> {
  const userId = await getAuthUserId();
  if (userId) {
    try {
      await supabase
        .from("delivery_zones")
        .update({
          ...(zone.township_name && { township_name: zone.township_name }),
          ...(zone.rate !== undefined && { rate: Number(zone.rate) }),
          ...(zone.estimated_transit_timeline && { estimated_transit_timeline: zone.estimated_transit_timeline }),
          ...(zone.region && { region: zone.region }),
          ...(zone.division && { division: zone.division }),
        })
        .eq("id", id)
        .eq("owner_id", userId);
    } catch (e) {
      console.warn("updateDeliveryZone Supabase error:", e);
    }
  }
  return ls.updateDeliveryZoneLS(id, zone);
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  const userId = await getAuthUserId();
  if (userId) {
    try {
      await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", id)
        .eq("owner_id", userId);
    } catch (e) {
      console.warn("deleteDeliveryZone Supabase error:", e);
    }
  }
  return ls.deleteDeliveryZoneLS(id);
}