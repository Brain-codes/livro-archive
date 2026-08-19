import { corsHeaders } from "./cors.ts";

export function successResponse(
  data: unknown = {},
  message = "Request successful",
  meta: Record<string, unknown> = {},
  status = 200,
) {
  return new Response(
    JSON.stringify({ success: true, message, data, meta, errors: null }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    },
  );
}

export function errorResponse(
  message = "Request failed",
  errors: unknown = null,
  status = 400,
) {
  return new Response(
    JSON.stringify({ success: false, message, data: null, meta: {}, errors }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    },
  );
}
