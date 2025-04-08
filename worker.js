/**
 * Lensify - Sensor and Aperture Calculator
 * Cloudflare Worker implementation
 * 
 * This Worker implements sensor size and aperture conversion calculations
 * Based on the input sensor type and aperture value, it calculates the equivalent aperture
 */

// Sensor database - contains various sensor sizes and their corresponding crop factors
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

// CORS headers settings - allow cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

/**
 * Calculate equivalent sensor and aperture at different focal lengths
 * @param {string} originalSensorId - Original sensor ID
 * @param {number} originalFocalLength - Original focal length (mm)
 * @param {number} newFocalLength - New focal length (mm)
 * @param {number} aperture - Aperture value
 * @returns {Object} - Calculation results
 */
function calculateEquivalentSensor(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  // Get the crop factor of the original sensor
  const originalCropFactor = SENSORS[originalSensorId].cropFactor;
  
  // Calculate the actual sensor area ratio used in digital zoom
  // In digital zoom, only the central part of the sensor is used, and the area ratio is the square of the focal length ratio
  const areaRatio = (newFocalLength / originalFocalLength) ** 2;
  
  // Calculate the new equivalent crop factor: original crop factor * digital zoom ratio
  const newCropFactor = parseFloat((originalCropFactor * (newFocalLength / originalFocalLength)).toFixed(2));
  
  // Find the closest matching sensor
  let closestSensor = {
    id: "",
    name: "",
    cropFactor: 0
  };
  let minDifference = Infinity;
  
  for (const [sensorId, sensorData] of Object.entries(SENSORS)) {
    const difference = Math.abs(sensorData.cropFactor - newCropFactor);
    if (difference < minDifference) {
      minDifference = difference;
      closestSensor = {
        id: sensorId,
        name: sensorData.name,
        cropFactor: sensorData.cropFactor
      };
    }
  }
  
  // Calculate the current actual equivalent sensor size
  // Formatted as "1/1.52", etc., based on the original sensor size and zoom ratio
  let effectiveSensorSize;
  if (originalSensorId.startsWith("1/")) {
    // If the original sensor is in the 1/x format
    const originalDenominator = parseFloat(originalSensorId.substring(2));
    const newDenominator = originalDenominator * Math.sqrt(areaRatio);
    effectiveSensorSize = `1/${newDenominator.toFixed(2)}`;
  } else {
    // For other sensor size formats, directly use closestSensor
    effectiveSensorSize = closestSensor.name;
  }
  
  // Calculate equivalent aperture
  const equivalentAperture = parseFloat((aperture * newCropFactor).toFixed(1));
  
  // Calculate percentage change in angle of view
  // Example: From 50mm to 35mm, the change is (1 - 35/50) * 100 = 30%, which means angle of view increased by 30%
  const angleOfViewChange = ((1 - (Number(newFocalLength) / Number(originalFocalLength))) * 100).toFixed(1);
  
  // Calculate relative sensor area change (1/zoom area ratio)
  const relativeSensorArea = parseFloat((1 / areaRatio).toFixed(2));
  
  // Calculate equivalent focal length (relative to full frame)
  const originalEquivalentFocalLength = parseFloat((originalFocalLength * originalCropFactor).toFixed(1));
  const newEquivalentFocalLength = parseFloat((newFocalLength * newCropFactor).toFixed(1));
  
  // Return results
  return {
    exactCropFactor: newCropFactor,
    closestSensor: closestSensor,
    effectiveSensorSize: effectiveSensorSize,
    cropFactorDifference: parseFloat(minDifference.toFixed(3)),
    equivalentAperture: equivalentAperture,
    originalFocalLength: originalFocalLength,
    newFocalLength: newFocalLength,
    originalSensor: {
      id: originalSensorId,
      name: SENSORS[originalSensorId].name,
      cropFactor: originalCropFactor
    },
    angleOfViewChange: angleOfViewChange + "%",
    relativeSensorArea: relativeSensorArea,
    areaRatio: parseFloat(areaRatio.toFixed(2)),
    originalEquivalentFocalLength: originalEquivalentFocalLength,
    newEquivalentFocalLength: newEquivalentFocalLength
  };
}

/**
 * Main function to handle API requests
 */
async function handleRequest(request) {
  // Add health check endpoint
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle health check
  if (path === "/health" || path === "/") {
    return new Response(JSON.stringify({ status: "ok", version: "1.1.0" }), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-cache"
      }
    });
  }
  
  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Debug info: log request details
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log("Request path:", path);
  
  // Check if this is an equivalent sensor calculation request
  if (path === "/focal-equiv" || path === "/focal-equivalent") {
    const originalSensorId = url.searchParams.get("originalSensor");
    const originalFocalLength = parseFloat(url.searchParams.get("originalFocal"));
    const newFocalLength = parseFloat(url.searchParams.get("newFocal"));
    const aperture = parseFloat(url.searchParams.get("aperture"));
    
    console.log("Focal Equiv Params:", { 
      originalSensorId, 
      originalFocalLength, 
      newFocalLength, 
      aperture 
    });
    
    // Validate parameters
    if (!originalSensorId || !SENSORS[originalSensorId]) {
      return new Response(
        JSON.stringify({ error: "Invalid original sensor size" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (isNaN(originalFocalLength) || originalFocalLength <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid original focal length" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (isNaN(newFocalLength) || newFocalLength <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid new focal length" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (isNaN(aperture) || aperture <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid aperture value" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Calculate equivalent sensor and aperture
    const result = calculateEquivalentSensor(
      originalSensorId,
      originalFocalLength,
      newFocalLength,
      aperture
    );
    
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }
  
  // Regular aperture equivalent calculation
  // Get sensor type and aperture value parameters
  const sensorSize = url.searchParams.get("sensorSize");
  const aperture = parseFloat(url.searchParams.get("aperture"));
  
  console.log("Aperture Equiv Params:", { sensorSize, aperture });

  // Validate parameters
  if (!sensorSize || !SENSORS[sensorSize]) {
    return new Response(
      JSON.stringify({ error: "Invalid sensor size" }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (isNaN(aperture) || aperture <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid aperture value" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Get sensor crop factor
  const cropFactor = SENSORS[sensorSize].cropFactor;
  
  // Calculate equivalent aperture
  const equivalentAperture = parseFloat((aperture * cropFactor).toFixed(1));

  // Return calculation results
  const result = {
    sensorSize: SENSORS[sensorSize].name,
    sensorId: sensorSize,
    cropFactor: cropFactor,
    inputAperture: aperture,
    equivalentAperture: equivalentAperture
  };

  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

// Register the Worker's fetch event handler
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
