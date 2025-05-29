// src/types/index.ts

// Re-export all types from the auto-generated Supabase types file
export * from './supabase';

// Re-export all types from the custom entities file
export * from './entities';

// You can also define or re-export other shared helper types here if needed.
// For example, if you had more complex union types or utility types
// specific to your application's data handling, they could go here.

// Example of a more specific re-export if you only want to expose certain parts:
// export type { Database, Tables, Enums } from './supabase';
// export type { User, Politician, Party, Promise, LegislativeBill, FeedItemData, EntityType } from './entities';
