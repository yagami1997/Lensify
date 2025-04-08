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
 * Safe conversion to number with fallback to default
 * @param {any} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Converted number or default
 */
function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safe conversion to formatted number with decimal places
 * @param {any} value - Value to convert
 * @param {number} decimals - Number of decimal places
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Formatted number
 */
function safeFormattedNumber(value, decimals = 1, defaultValue = 0) {
  const num = safeNumber(value, defaultValue);
  return Number(num.toFixed(decimals));
}

/**
 * Safe conversion to string with fallback to default
 * @param {any} value - Value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} - Converted string or default
 */
function safeString(value, defaultValue = "") {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Calculate equivalent sensor and aperture at different focal lengths
 * @param {string} originalSensorId - Original sensor ID
 * @param {number} originalFocalLength - Original focal length (mm)
 * @param {number} newFocalLength - New focal length (mm)
 * @param {number} aperture - Aperture value
 * @returns {Object} - Calculation results
 */
function calculateEquivalentSensor(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  // Ensure all inputs have correct types
  const sensorId = safeString(originalSensorId);
  const origFocalLen = safeNumber(originalFocalLength, 1);
  const newFocalLen = safeNumber(newFocalLength, 1);
  const apertureVal = safeFormattedNumber(aperture, 1, 1);
  
  // Get the crop factor of the original sensor
  const sensorData = SENSORS[sensorId];
  const originalCropFactor = sensorData ? safeNumber(sensorData.cropFactor, 1) : 1;
  
  // Calculate the actual sensor area ratio used in digital zoom
  const areaRatio = (newFocalLen / origFocalLen) ** 2;
  
  // Calculate the new equivalent crop factor
  const newCropFactor = safeFormattedNumber(originalCropFactor * (newFocalLen / origFocalLen), 2);
  
  // Find the closest matching sensor
  let closestSensor = { id: "", name: "", cropFactor: 0 };
  let minDifference = Infinity;
  
  for (const [id, data] of Object.entries(SENSORS)) {
    const difference = Math.abs(data.cropFactor - newCropFactor);
    if (difference < minDifference) {
      minDifference = difference;
      closestSensor = {
        id: safeString(id),
        name: safeString(data.name),
        cropFactor: safeNumber(data.cropFactor)
      };
    }
  }
  
  // Calculate the current actual equivalent sensor size
  let effectiveSensorSize = "";
  if (sensorId.startsWith("1/")) {
    const originalDenominator = safeNumber(sensorId.substring(2), 1);
    const newDenominator = originalDenominator * Math.sqrt(areaRatio);
    effectiveSensorSize = `1/${safeFormattedNumber(newDenominator, 2)}`;
  } else {
    effectiveSensorSize = safeString(closestSensor.name, "Unknown");
  }
  
  // Calculate equivalent aperture
  const equivalentAperture = safeFormattedNumber(apertureVal * newCropFactor, 1);
  
  // Calculate percentage change in angle of view
  // This formula calculates how much wider or narrower the field of view becomes
  // when changing from the original focal length to the new focal length.
  // Example: Moving from 50mm to 35mm widens the view by (1 - (35/50)) * 100 = 30%
  // A positive percentage means a wider view, while negative means a narrower view.
  const angleOfViewChangeValue = safeFormattedNumber((1 - (newFocalLen / origFocalLen)) * 100, 1);
  const angleOfViewChange = `${angleOfViewChangeValue}%`;
  
  // Calculate perspective change (when maintaining same framing by changing distance)
  // This calculates how perspective changes when you maintain the same subject size
  // by adjusting your distance when changing focal lengths
  // Example: Moving from 50mm to 85mm while maintaining framing requires stepping back,
  // resulting in perspective compression of (85/50 - 1) * 100 = 70%
  // Positive values indicate compression, negative values indicate expansion
  const perspectiveChangeValue = safeFormattedNumber((newFocalLen / origFocalLen - 1) * 100, 1);
  const perspectiveChange = `${perspectiveChangeValue}%`;
  
  // Calculate relative sensor area change
  const relativeSensorArea = safeFormattedNumber(1 / areaRatio, 2);
  
  // Calculate equivalent focal lengths
  const originalEquivalentFocalLength = safeFormattedNumber(origFocalLen * originalCropFactor, 1);
  const newEquivalentFocalLength = safeFormattedNumber(newFocalLen * newCropFactor, 1);
  
  // Return results
  return {
    exactCropFactor: newCropFactor,
    closestSensor: closestSensor,
    effectiveSensorSize: effectiveSensorSize,
    cropFactorDifference: safeFormattedNumber(minDifference, 3),
    equivalentAperture: equivalentAperture,
    originalFocalLength: origFocalLen,
    newFocalLength: newFocalLen,
    originalSensor: {
      id: sensorId,
      name: sensorData ? safeString(sensorData.name) : "Unknown",
      cropFactor: originalCropFactor
    },
    angleOfViewChange: angleOfViewChange,
    perspectiveChange: perspectiveChange,
    relativeSensorArea: relativeSensorArea,
    areaRatio: safeFormattedNumber(areaRatio, 2),
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
    const originalSensorId = safeString(url.searchParams.get("originalSensor"));
    const originalFocalLength = safeNumber(url.searchParams.get("originalFocal"));
    const newFocalLength = safeNumber(url.searchParams.get("newFocal"));
    const aperture = safeNumber(url.searchParams.get("aperture"));
    
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
    
    if (originalFocalLength <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid original focal length" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (newFocalLength <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid new focal length" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (aperture <= 0) {
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
  const sensorSize = safeString(url.searchParams.get("sensorSize"));
  const aperture = safeNumber(url.searchParams.get("aperture"));
  
  console.log("Aperture Equiv Params:", { sensorSize, aperture });

  // Validate parameters
  if (!sensorSize || !SENSORS[sensorSize]) {
    return new Response(
      JSON.stringify({ error: "Invalid sensor size" }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (aperture <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid aperture value" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Get sensor crop factor and calculate equivalent aperture
  const sensorData = SENSORS[sensorSize];
  const cropFactor = safeNumber(sensorData.cropFactor, 1);
  const equivalentAperture = safeFormattedNumber(aperture * cropFactor, 1);

  // Return calculation results
  const result = {
    sensorSize: safeString(sensorData.name),
    sensorId: sensorSize,
    cropFactor: cropFactor,
    inputAperture: safeFormattedNumber(aperture, 1),
    equivalentAperture: equivalentAperture
  };

  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

// Register the Worker's fetch event handler
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
