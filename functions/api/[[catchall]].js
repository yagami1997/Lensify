// Sensor database
const SENSORS = {
  "medium-format": { cropFactor: 0.7, name: "Medium Format" },
  "full-frame": { cropFactor: 1.0, name: "Full Frame" },
  "aps-h": { cropFactor: 1.3, name: "APS-H" },
  "aps-c-canon": { cropFactor: 1.6, name: "APS-C (Canon)" },
  "aps-c": { cropFactor: 1.5, name: "APS-C" },
  "micro-four-thirds": { cropFactor: 2.0, name: "Micro Four Thirds" },
  "1-inch": { cropFactor: 2.7, name: "1-inch" },
  "1/1.14": { cropFactor: 3.05, name: "1/1.14-inch" },
  "1/1.28": { cropFactor: 3.26, name: "1/1.28-inch" },
  "1/1.3": { cropFactor: 3.4, name: "1/1.3-inch" },
  "1/1.31": { cropFactor: 3.43, name: "1/1.31-inch" },
  "1/1.35": { cropFactor: 3.47, name: "1/1.35-inch" },
  "1/1.4": { cropFactor: 3.7, name: "1/1.4-inch" },
  "1/1.49": { cropFactor: 3.85, name: "1/1.49-inch" },
  "1/1.5": { cropFactor: 3.9, name: "1/1.5-inch" },
  "1/1.56": { cropFactor: 4.0, name: "1/1.56-inch" },
  "1/1.57": { cropFactor: 4.05, name: "1/1.57-inch" },
  "1/1.6": { cropFactor: 4.1, name: "1/1.6-inch" },
  "1/1.7": { cropFactor: 4.5, name: "1/1.7-inch" },
  "1/1.74": { cropFactor: 4.6, name: "1/1.74-inch" },
  "1/1.78": { cropFactor: 4.7, name: "1/1.78-inch" },
  "1/1.95": { cropFactor: 5.0, name: "1/1.95-inch" },
  "1/2": { cropFactor: 5.1, name: "1/2-inch" },
  "1/2.3": { cropFactor: 5.64, name: "1/2.3-inch" },
  "1/2.55": { cropFactor: 6.3, name: "1/2.55-inch" },
  "1/2.76": { cropFactor: 6.7, name: "1/2.76-inch" },
  "1/3": { cropFactor: 7.21, name: "1/3-inch" },
  "1/3.06": { cropFactor: 7.4, name: "1/3.06-inch" },
  "1/3.2": { cropFactor: 7.7, name: "1/3.2-inch" },
  "1/3.4": { cropFactor: 8.1, name: "1/3.4-inch" },
  "1/3.6": { cropFactor: 8.6, name: "1/3.6-inch" },
  "1/4": { cropFactor: 9.6, name: "1/4-inch" }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function safeFormattedNumber(value, decimals = 1, defaultValue = 0) {
  const num = safeNumber(value, defaultValue);
  return Number(num.toFixed(decimals));
}

function safeString(value, defaultValue = "") {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

function calculateEquivalentSensor(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  const sensorId = safeString(originalSensorId);
  const origFocalLen = safeNumber(originalFocalLength, 1);
  const newFocalLen = safeNumber(newFocalLength, 1);
  const apertureVal = safeFormattedNumber(aperture, 1, 1);
  
  const sensorData = SENSORS[sensorId];
  const originalCropFactor = sensorData ? safeNumber(sensorData.cropFactor, 1) : 1;
  const areaRatio = (newFocalLen / origFocalLen) ** 2;
  const newCropFactor = safeFormattedNumber(originalCropFactor * (newFocalLen / origFocalLen), 2);
  
  let closestSensor = { id: "", name: "", cropFactor: 0 };
  let minDifference = Infinity;
  
  for (const [id, data] of Object.entries(SENSORS)) {
    const difference = Math.abs(data.cropFactor - newCropFactor);
    if (difference < minDifference) {
      minDifference = difference;
      closestSensor = { id: safeString(id), name: safeString(data.name), cropFactor: safeNumber(data.cropFactor) };
    }
  }
  
  let effectiveSensorSize = "";
  if (sensorId.startsWith("1/")) {
    const originalDenominator = safeNumber(sensorId.substring(2), 1);
    const newDenominator = originalDenominator * Math.sqrt(areaRatio);
    effectiveSensorSize = "1/" + safeFormattedNumber(newDenominator, 2);
  } else {
    effectiveSensorSize = safeString(closestSensor.name, "Unknown");
  }
  
  return {
    exactCropFactor: newCropFactor,
    closestSensor: closestSensor,
    effectiveSensorSize: effectiveSensorSize,
    cropFactorDifference: safeFormattedNumber(minDifference, 3),
    equivalentAperture: safeFormattedNumber(apertureVal * newCropFactor, 1),
    originalFocalLength: origFocalLen,
    newFocalLength: newFocalLen,
    originalSensor: { id: sensorId, name: sensorData ? safeString(sensorData.name) : "Unknown", cropFactor: originalCropFactor },
    angleOfViewChange: safeFormattedNumber((1 - (newFocalLen / origFocalLen)) * 100, 1) + "%",
    perspectiveChange: safeFormattedNumber((newFocalLen / origFocalLen - 1) * 100, 1) + "%",
    relativeSensorArea: safeFormattedNumber(1 / areaRatio, 2),
    areaRatio: safeFormattedNumber(areaRatio, 2),
    originalEquivalentFocalLength: safeFormattedNumber(origFocalLen * originalCropFactor, 1),
    newEquivalentFocalLength: safeFormattedNumber(newFocalLen * newCropFactor, 1)
  };
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle OPTIONS
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (path === "/api" || path === "/api/" || path === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", version: "1.1.0" }), {
      headers: { ...corsHeaders, "Cache-Control": "no-cache" }
    });
  }

  // Aperture calculation
  if (path === "/api/calculate") {
    const sensorSize = url.searchParams.get("sensorSize");
    const aperture = safeNumber(url.searchParams.get("aperture"));

    if (!sensorSize || !SENSORS[sensorSize]) {
      return new Response(JSON.stringify({ error: "Invalid sensor size" }), { status: 400, headers: corsHeaders });
    }
    if (aperture <= 0) {
      return new Response(JSON.stringify({ error: "Invalid aperture value" }), { status: 400, headers: corsHeaders });
    }

    const sensorData = SENSORS[sensorSize];
    const cropFactor = safeNumber(sensorData.cropFactor, 1);
    const result = {
      sensorSize: safeString(sensorData.name),
      sensorId: sensorSize,
      cropFactor: cropFactor,
      inputAperture: safeFormattedNumber(aperture, 1),
      equivalentAperture: safeFormattedNumber(aperture * cropFactor, 1)
    };
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }

  // Focal length calculation
  if (path === "/api/focal-equiv" || path === "/api/focal-equivalent") {
    const originalSensorId = safeString(url.searchParams.get("originalSensor"));
    const originalFocalLength = safeNumber(url.searchParams.get("originalFocal"));
    const newFocalLength = safeNumber(url.searchParams.get("newFocal"));
    const aperture = safeNumber(url.searchParams.get("aperture"));
    
    if (!originalSensorId || !SENSORS[originalSensorId]) {
      return new Response(JSON.stringify({ error: "Invalid original sensor size" }), { status: 400, headers: corsHeaders });
    }
    if (originalFocalLength <= 0 || newFocalLength <= 0 || aperture <= 0) {
      return new Response(JSON.stringify({ error: "Invalid parameters" }), { status: 400, headers: corsHeaders });
    }
    
    const result = calculateEquivalentSensor(originalSensorId, originalFocalLength, newFocalLength, aperture);
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }

  // Not found
  return new Response(JSON.stringify({ error: "Not Found", path: path }), { status: 404, headers: corsHeaders });
}
