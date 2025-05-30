// src/lib/supabase/data.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PartyFilterOption, ProvinceFilterOption } from "@/types/entities";

export async function getPartyFilterOptions(): Promise<PartyFilterOption[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('parties')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching party filter options:", error);
    return [];
  }
  return data.map(p => ({ id: String(p.id), name: p.name })) || [];
}

export async function getProvinceFilterOptions(): Promise<ProvinceFilterOption[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching province filter options:", error);
    return [];
  }
  return data.map(p => ({ id: String(p.id), name: p.name })) || [];
}

export async function checkIfUserFollowsEntity(userId: string, entityId: number, entityType: string = 'Politician'): Promise<boolean> {
  if (!userId) return false;

  const supabase = createSupabaseServerClient();
  const { error, count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .eq('entity_type', entityType);

  if (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
  return (count || 0) > 0;
}

export async function getUserVoteForEntity(
  userId: string,
  entityId: number,
  entityType: string
): Promise<{ vote_type: number } | null> {
  if (!userId) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('entity_votes')
    .select('vote_type')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .maybeSingle(); // Use maybeSingle as user might not have voted

  if (error) {
    console.error(`Error fetching user vote for ${entityType} ${entityId}:`, error);
    return null;
  }
  return data;
}
