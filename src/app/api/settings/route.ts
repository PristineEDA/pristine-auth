import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("config_data, updated_at")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    config_data: data?.config_data ?? {},
    updated_at: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: result.error.issues },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        config_data: result.data.config_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
