"use client";
import { createClient } from "@supabase/supabase-js";
// Cliente de Supabase para el navegador (login + token). Solo identidad.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
