// src/lib/supabase/queries.ts
"use server"; // Assuming these will often be used in Server Actions/Components

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/types/index'; // Use the central types export

/**
 * Represents the result of a Supabase query that expects a single record.
 */
export interface SingleQueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Represents the result of a Supabase query that expects a list of records.
 */
export interface ListQueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

/**
 * A generic error handling wrapper for Supabase queries that return a single item.
 * @param queryPromise The Supabase query promise (e.g., .single(), .maybeSingle())
 */
async function handleSupabaseSingleQuery<T>(
  queryPromise: PromiseLike<{ data: T | null; error: any | null }>
): Promise<SingleQueryResult<T>> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.error('Supabase query error (single):', error);
      return { data: null, error: new Error(error.message || 'Supabase query failed') };
    }
    return { data, error: null };
  } catch (e: any) {
    console.error('Unhandled Supabase query exception (single):', e);
    return { data: null, error: new Error(e.message || 'An unexpected error occurred') };
  }
}

/**
 * A generic error handling wrapper for Supabase queries that return a list of items.
 * @param queryPromise The Supabase query promise (e.g., .select())
 */
async function handleSupabaseListQuery<T>(
  queryPromise: PromiseLike<{ data: T[] | null; error: any | null }>
): Promise<ListQueryResult<T>> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.error('Supabase query error (list):', error);
      return { data: null, error: new Error(error.message || 'Supabase query failed') };
    }
    return { data, error: null };
  } catch (e: any) {
    console.error('Unhandled Supabase query exception (list):', e);
    return { data: null, error: new Error(e.message || 'An unexpected error occurred') };
  }
}

/**
 * Fetches a single record by its ID from a specified table.
 * @param supabase The Supabase client instance.
 * @param table The name of the table to query.
 * @param id The ID of the record to fetch.
 * @param selectOptional A string specifying which columns to select, e.g., "*", "id, name". Defaults to "*".
 * @returns A promise that resolves to a SingleQueryResult.
 */
export async function getRecordById<
  TableName extends keyof Database['public']['Tables']
>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  id: Tables<TableName>['Row']['id'], // Type-safe ID based on table schema
  selectOptional: string = '*'
): Promise<SingleQueryResult<Tables<TableName>['Row']>> {
  // Typescript struggles to infer the correct return type when 'select' is dynamic.
  // We cast to `any` here, Supabase client itself ensures the data shape matches the select string.
  const query = supabase.from(table).select(selectOptional).eq('id', id).single() as any;
  return handleSupabaseSingleQuery(query);
}

/**
 * Fetches multiple records from a specified table, with optional select and filtering.
 * Note: For complex select statements, the return type `Tables<TableName>['Row'][]` is a simplification.
 * The actual shape of returned objects will match the `select` string.
 *
 * @param supabase The Supabase client instance.
 * @param table The name of the table to query.
 * @param options Optional query parameters.
 * @param options.select A string specifying which columns to select, e.g., "*", "id, name, relationships(*)". Defaults to "*".
 * @param options.eq An object defining equality filters, e.g., { column_name: 'value' }.
 * @param options.order An object defining ordering, e.g., { column: 'created_at', ascending: false }.
 * @param options.limit The maximum number of records to return.
 * @returns A promise that resolves to a ListQueryResult.
 */
export async function getRecords<
  TableName extends keyof Database['public']['Tables']
>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  options?: {
    select?: string;
    eq?: { [K in keyof Tables<TableName>['Row']]?: Tables<TableName>['Row'][K] };
    order?: { column: keyof Tables<TableName>['Row'], ascending?: boolean };
    limit?: number;
    // TODO: Add support for more complex filters: neq, gt, lt, gte, lte, like, ilike, in, is, etc.
    // TODO: Add support for pagination (range).
  }
): Promise<ListQueryResult<Tables<TableName>['Row']>> {
  let queryBuilder = supabase.from(table).select(options?.select || '*');

  if (options?.eq) {
    for (const key in options.eq) {
      // Ensure the key is a valid column name for the table
      const col = key as keyof Tables<TableName>['Row'];
      const value = options.eq[col];
      if (value !== undefined) {
        queryBuilder = queryBuilder.eq(col as string, value);
      }
    }
  }

  if (options?.order) {
    queryBuilder = queryBuilder.order(options.order.column as string, {
      ascending: options.order.ascending !== undefined ? options.order.ascending : true,
    });
  }

  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  // Cast to `any` for the same reason as getRecordById. Supabase handles dynamic select return types.
  const query = queryBuilder as any;
  return handleSupabaseListQuery(query);
}

/*
Example Usage (in a Server Component or Server Action):

import { createSupabaseServerClient } from '@/lib/supabase/server'; // or your server client factory
import { getRecordById, getRecords } from '@/lib/supabase/queries';
import type { Politician } from '@/types/index'; // Assuming Politician is in entities.ts

async function MyServerComponent() {
  const supabase = createSupabaseServerClient(); // Or however you get your server client

  const { data: politician, error: politicianError } = await getRecordById(supabase, 'politicians', 1);
  if (politicianError) {
    // Handle error
  }
  // Use politician data

  const { data: parties, error: partiesError } = await getRecords(supabase, 'parties', {
    select: 'id, name, ideology',
    eq: { ideology: 'Socialism' },
    order: { column: 'name', ascending: true },
    limit: 10
  });
  if (partiesError) {
    // Handle error
  }
  // Use parties list
  
  return (<div>...</div>);
}
*/
