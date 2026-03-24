import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();

  // Log the full inner payload so we can inspect the structure
  console.log("[cal-webhook] full payload.payload:", JSON.stringify(body.payload, null, 2));

  const inner = body.payload;
  if (!inner) {
    console.error("[cal-webhook] No payload found in body");
    return new Response("Missing payload", { status: 400 });
  }

  const email = inner.attendees?.[0]?.email;
  const scheduledAt = inner.startTime;
  const status = "scheduled";

  // Extract notes from Cal.com — could be in responses, description, or additionalNotes
  const notes =
    inner.responses?.notes?.value ??
    inner.responses?.notes ??
    inner.additionalNotes ??
    inner.description ??
    null;

  console.log("[cal-webhook] extracted fields:", { email, scheduledAt, notes });

  if (!email || !scheduledAt) {
    console.error("[cal-webhook] Missing email or startTime");
    return new Response("Missing required fields", { status: 400 });
  }

  // Look up the client by email
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .single();

  if (clientError || !client) {
    console.error("[cal-webhook] Client lookup failed:", clientError);
    return new Response("Client not found", { status: 404 });
  }

  // Insert the consultation
  const { error: insertError } = await supabase.from("consultations").insert({
    client_id: client.id,
    scheduled_at: scheduledAt,
    status,
    notes,
  });

  if (insertError) {
    console.error("[cal-webhook] Insert failed:", insertError);
    return new Response("Insert failed", { status: 500 });
  }

  console.log("[cal-webhook] Consultation created for", email);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
