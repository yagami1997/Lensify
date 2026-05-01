import { calculateApertureEquivalent, calculateFocalEquivalent } from "./lensify/lib/calculations.mjs";

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

function getPagesOrigin(url, env) {
  return env.PAGES_URL || "https://lensify.pages.dev";
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApiRequest(request);
    }

    try {
      const pagesUrl = new URL(url.pathname + url.search, getPagesOrigin(url, env));
      return fetch(new Request(pagesUrl, request));
    } catch (error) {
      return new Response(`Error proxying to Pages: ${error.message}`, { status: 500 });
    }
  }
};
