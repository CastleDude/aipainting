import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SubscriptionTier = "free" | "basic" | "premium" | "ultimate";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  tier: SubscriptionTier;
  credits: number;
  daily_used: number;
  daily_reset_at?: string;
  tools_daily_used: number;
  role: "user" | "admin";
  created_at: string;
}
