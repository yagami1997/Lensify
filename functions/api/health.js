/**
 * Pages Function - Health Check Endpoint
 * Handles GET /api/health
 */

export async function onRequest(context) {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle OPTIONS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ status: "ok", version: "1.1.0" }), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-cache"
    }
  });
}
