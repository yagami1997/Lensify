import { calculateApertureEquivalent, calculateFocalEquivalent } from "../../lib/calculations.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (path === "/api/calculate" || (path === "/api" && url.searchParams.has("sensorSize"))) {
    try {
      return jsonResponse(
        calculateApertureEquivalent(
          url.searchParams.get("sensorSize"),
          url.searchParams.get("aperture")
        )
      );
    } catch (error) {
      return jsonResponse({ error: error.message }, 400);
    }
  }

  if (path === "/api/focal-equiv" || path === "/api/focal-equivalent") {
    try {
      return jsonResponse(
        calculateFocalEquivalent(
          url.searchParams.get("originalSensor"),
          url.searchParams.get("originalFocal"),
          url.searchParams.get("newFocal"),
          url.searchParams.get("aperture")
        )
      );
    } catch (error) {
      return jsonResponse({ error: error.message }, 400);
    }
  }

  if (path === "/api" || path === "/api/health") {
    return jsonResponse({ status: "ok", version: "1.2.0" }, 200, {
      "Cache-Control": "no-cache"
    });
  }

  return jsonResponse({ error: "Not Found", path }, 404);
}
