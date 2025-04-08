/**
 * San Francisco JS - Lensify Frontend Interaction Script
 * 
 * This script handles user input and interaction with the Cloudflare Worker API
 * Gets calculation results and updates the interface
 */

// Worker API URL configuration - supports multiple URL formats for compatibility
const API_URL = "https://lensify.encveil.dev";
const FALLBACK_URL = "https://lensify-calculator.workers.dev";

// Custom route URL examples (choose one based on your actual configuration and uncomment)
// const API_URL = "https://api.example.com";                   // If using api.example.com/calculate*
// const API_URL = "https://example.com/api";                // If using example.com/api/calculate*
// const API_URL = "https://calculator.example.com";         // If using calculator.example.com/*
// const API_URL = "https://example.com/tools/lensify";      // If using example.com/tools/lensify/*

// DOM elements - Aperture calculator
const sensorSelect = document.getElementById("sensorSize");
const apertureInput = document.getElementById("aperture");
const calculateButton = document.getElementById("calculate");
const resultContainer = document.getElementById("result");
const resultSensor = document.getElementById("result-sensor");
const resultCropFactor = document.getElementById("result-crop-factor");
const resultInputAperture = document.getElementById("result-input-aperture");
const resultEquivalentAperture = document.getElementById("result-equivalent-aperture");
const connectionStatus = document.getElementById("connection-status");

// DOM elements - Focal length calculator
const originalSensorSelect = document.getElementById("originalSensor");
const originalFocalInput = document.getElementById("originalFocal");
const newFocalInput = document.getElementById("newFocal");
const focalApertureInput = document.getElementById("focalAperture");
const calculateFocalButton = document.getElementById("calculateFocal");
const focalResultContainer = document.getElementById("focalResult");

// DOM elements - Tabs
const tabButtonAperture = document.getElementById("tab-button-aperture");
const tabButtonFocal = document.getElementById("tab-button-focal");
const tabAperture = document.getElementById("tab-aperture");
const tabFocal = document.getElementById("tab-focal");

/**
 * Initialize page interaction
 */
function initializeApp() {
  console.log("Initializing app...");
  
  // First check if DOM elements exist
  if (!sensorSelect || !apertureInput || !calculateButton) {
    console.error("Missing essential DOM elements for aperture calculator");
    return;
  }
  
  // Set tab button texts to English
  if (tabButtonAperture && tabButtonFocal) {
    tabButtonAperture.textContent = "Aperture Calculator";
    tabButtonFocal.textContent = "Focal Length Calculator";
  }
  
  // Add calculate button click event
  calculateButton.addEventListener("click", calculateEquivalentAperture);
  
  // Check if focal length calculator elements exist
  const hasFocalTab = tabButtonFocal && tabButtonAperture && tabAperture && tabFocal && 
                      originalSensorSelect && originalFocalInput && newFocalInput && 
                      focalApertureInput && calculateFocalButton;
  
  if (hasFocalTab) {
    console.log("Focal length tab elements found, initializing...");
    
    // Add focal length calculation functionality
    calculateFocalButton.addEventListener("click", calculateFocalEquivalent);
    
    // Add tab switch event
    tabButtonAperture.addEventListener("click", () => switchTab("aperture"));
    tabButtonFocal.addEventListener("click", () => switchTab("focal"));
    
    // Add keyboard event - focal length calculator
    focalApertureInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        calculateFocalEquivalent();
      }
    });
    
    // Add input validation - focal length calculator
    focalApertureInput.addEventListener("input", validateApertureInput);
    originalFocalInput.addEventListener("input", validateFocalLengthInput);
    newFocalInput.addEventListener("input", validateFocalLengthInput);
    
    // Initialize with default aperture calculator tab
    switchTab("aperture");
  } else {
    console.warn("Focal length calculator elements not found, using aperture calculator only mode");
  }
  
  // Add keyboard event - aperture calculator
  apertureInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      calculateEquivalentAperture();
    }
  });
  
  // Add input validation - aperture calculator
  apertureInput.addEventListener("input", validateApertureInput);
  
  // Check API connection
  checkApiConnection();
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  console.log(`Switching to tab: ${tabName}`);
  
  // Check if all tab elements exist
  if (!tabButtonAperture || !tabButtonFocal || !tabAperture || !tabFocal) {
    console.error("Tab elements missing, cannot switch tabs");
    return;
  }
  
  // Remove active class from all tabs
  tabButtonAperture.classList.remove("active");
  tabButtonFocal.classList.remove("active");
  tabAperture.classList.remove("active");
  tabFocal.classList.remove("active");
  
  // Add active class to selected tab
  if (tabName === "aperture") {
    tabButtonAperture.classList.add("active");
    tabAperture.classList.add("active");
  } else if (tabName === "focal") {
    tabButtonFocal.classList.add("active");
    tabFocal.classList.add("active");
  }
}

/**
 * Aperture input validation
 */
function validateApertureInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);
  
  // Ensure aperture value is positive
  if (isNaN(value) || value <= 0) {
    input.setCustomValidity("Please enter a positive number");
    input.reportValidity();
    return false;
  }
  
  input.setCustomValidity("");
  return true;
}

/**
 * Focal length input validation
 */
function validateFocalLengthInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);
  
  // Ensure focal length is positive integer
  if (isNaN(value) || value <= 0 || !Number.isInteger(value)) {
    input.setCustomValidity("Please enter a positive integer");
    input.reportValidity();
    return false;
  }
  
  input.setCustomValidity("");
  return true;
}

/**
 * Format response data to ensure consistent decimal places
 * @param {Object} data - Response data from API
 * @returns {Object} - Formatted data
 */
function formatResponseData(data) {
  // Create a copy to avoid modifying the original
  const formatted = {...data};
  
  // Format aperture values to 1 decimal place
  if (formatted.inputAperture !== undefined) {
    formatted.inputAperture = parseFloat(parseFloat(formatted.inputAperture).toFixed(1));
  }
  
  if (formatted.equivalentAperture !== undefined) {
    formatted.equivalentAperture = parseFloat(parseFloat(formatted.equivalentAperture).toFixed(1));
  }
  
  // Format crop factors to 2 decimal places
  if (formatted.cropFactor !== undefined) {
    formatted.cropFactor = parseFloat(parseFloat(formatted.cropFactor).toFixed(2));
  }
  
  if (formatted.exactCropFactor !== undefined) {
    formatted.exactCropFactor = parseFloat(parseFloat(formatted.exactCropFactor).toFixed(2));
  }
  
  // Format area values
  if (formatted.areaRatio !== undefined) {
    formatted.areaRatio = parseFloat(parseFloat(formatted.areaRatio).toFixed(2));
  }
  
  if (formatted.relativeSensorArea !== undefined) {
    formatted.relativeSensorArea = parseFloat(parseFloat(formatted.relativeSensorArea).toFixed(2));
  }
  
  // Format focal lengths to 1 decimal place
  if (formatted.originalEquivalentFocalLength !== undefined) {
    formatted.originalEquivalentFocalLength = parseFloat(parseFloat(formatted.originalEquivalentFocalLength).toFixed(1));
  }
  
  if (formatted.newEquivalentFocalLength !== undefined) {
    formatted.newEquivalentFocalLength = parseFloat(parseFloat(formatted.newEquivalentFocalLength).toFixed(1));
  }
  
  return formatted;
}

/**
 * Call Worker API to calculate equivalent aperture
 */
async function calculateEquivalentAperture() {
  // Validate input
  if (!validateApertureInput({ target: apertureInput })) {
    return;
  }
  
  // Get user input and ensure proper formatting
  const sensorSize = sensorSelect.value;
  const aperture = parseFloat(apertureInput.value);
  
  try {
    // Disable button, show loading state
    calculateButton.disabled = true;
    calculateButton.textContent = "Calculating...";
    
    // Use multiple URL formats to increase success rate
    let response;
    let error;
    
    // Try different URL formats
    const urlFormats = [
      `${API_URL}?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/health`,
      `${FALLBACK_URL}?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`
    ];
    
    // Try different URLs
    for (const url of urlFormats) {
      try {
        console.log("Trying URL:", url);
        response = await fetch(url, { method: 'GET' });
        
        if (response.ok) {
          console.log("Success with URL:", url);
          // Found working URL, exit loop
          break;
        }
      } catch (e) {
        console.log("Failed with URL:", url, e.message);
        error = e;
        // Continue to next URL
      }
    }
    
    // If no working URL, throw last error
    if (!response || !response.ok) {
      throw error || new Error("All API endpoints failed");
    }
    
    // Parse response data
    const data = await response.json();
    
    // Format response data consistently
    const formattedData = formatResponseData(data);
    
    // If health check response, use mock data
    if (formattedData.status === "ok" && formattedData.version) {
      console.log("Received health check response, using mock data");
      const mockData = {
        sensorSize: SENSORS[sensorSize]?.name || "Unknown",
        cropFactor: SENSORS[sensorSize]?.cropFactor || 1.0,
        inputAperture: parseFloat(aperture.toFixed(1)),
        equivalentAperture: parseFloat((aperture * (SENSORS[sensorSize]?.cropFactor || 1.0)).toFixed(1))
      };
      updateResultUI(mockData);
      return;
    }
    
    // Update result UI with formatted data
    updateResultUI(formattedData);
  } catch (error) {
    // Show error message
    showError(`Request failed: ${error.message || 'Unknown error'}`);
    
    // If API request fails, use local calculation with proper formatting
    console.log("API request failed, using local calculation");
    const fallbackCropFactor = SENSORS[sensorSize]?.cropFactor || 1.0;
    const fallbackData = {
      sensorSize: SENSORS[sensorSize]?.name || "Unknown",
      cropFactor: fallbackCropFactor,
      inputAperture: parseFloat(aperture.toFixed(1)),
      equivalentAperture: parseFloat((aperture * fallbackCropFactor).toFixed(1))
    };
    updateResultUI(fallbackData);
  } finally {
    // Restore button state
    calculateButton.disabled = false;
    calculateButton.textContent = "Calculate";
  }
}

/**
 * Calculate focal length equivalent
 */
async function calculateFocalEquivalent() {
  // Validate input
  if (!validateApertureInput({ target: focalApertureInput })) {
    return;
  }
  
  if (!validateFocalLengthInput({ target: originalFocalInput })) {
    return;
  }
  
  if (!validateFocalLengthInput({ target: newFocalInput })) {
    return;
  }
  
  // Get user input
  const originalSensor = originalSensorSelect.value;
  const originalFocal = parseInt(originalFocalInput.value);
  const newFocal = parseInt(newFocalInput.value);
  const aperture = parseFloat(focalApertureInput.value);
  
  try {
    // Disable button, show loading state
    calculateFocalButton.disabled = true;
    calculateFocalButton.textContent = "Calculating...";
    
    // Try different URL formats
    const urlFormats = [
      `${API_URL}/focal-equiv?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/focal-equivalent?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/focal-equiv?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/focal-equivalent?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`
    ];
    
    let response;
    let error;
    
    // Try different URLs
    for (const url of urlFormats) {
      try {
        console.log("Trying URL:", url);
        response = await fetch(url, { method: 'GET' });
        
        if (response.ok) {
          console.log("Success with URL:", url);
          // Found working URL, exit loop
          break;
        }
      } catch (e) {
        console.log("Failed with URL:", url, e.message);
        error = e;
        // Continue to next URL
      }
    }
    
    // If no working URL, use local calculation
    if (!response || !response.ok) {
      console.log("All API endpoints failed, using local calculation");
      const result = calculateLocalFocalEquivalent(originalSensor, originalFocal, newFocal, aperture);
      updateFocalResultUI({...result, aperture});
      return;
    }
    
    // Parse response data
    const data = await response.json();
    
    // Format response data consistently
    const formattedData = formatResponseData(data);
    
    // Add original aperture value for UI display (formatted)
    formattedData.aperture = parseFloat(aperture.toFixed(1));
    
    // Update result UI with formatted data
    updateFocalResultUI(formattedData);
  } catch (error) {
    // Show error message
    showError(`Request failed: ${error.message || 'Unknown error'}`);
    
    // Use local calculation
    const result = calculateLocalFocalEquivalent(originalSensor, originalFocal, newFocal, aperture);
    updateFocalResultUI({...result, aperture});
  } finally {
    // Restore button state
    calculateFocalButton.disabled = false;
    calculateFocalButton.textContent = "Calculate";
  }
}

/**
 * Local calculation of focal length equivalent
 */
function calculateLocalFocalEquivalent(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  // Format all input values
  aperture = parseFloat(aperture);
  originalFocalLength = parseInt(originalFocalLength);
  newFocalLength = parseInt(newFocalLength);
  
  // Get original sensor crop factor
  const originalCropFactor = SENSORS[originalSensorId]?.cropFactor || 1.0;
  
  // Calculate actual sensor area ratio in digital zoom
  const areaRatio = (newFocalLength / originalFocalLength) ** 2;
  
  // Calculate new equivalent crop factor - Format to 2 decimal places
  const newCropFactor = parseFloat((originalCropFactor * (newFocalLength / originalFocalLength)).toFixed(2));
  
  // Find closest sensor
  let closestSensor = null;
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
  
  // Calculate current actual equivalent sensor size
  let effectiveSensorSize;
  if (originalSensorId.startsWith("1/")) {
    // If original sensor is 1/x format
    const originalDenominator = parseFloat(originalSensorId.substring(2));
    const newDenominator = originalDenominator * Math.sqrt(areaRatio);
    effectiveSensorSize = `1/${newDenominator.toFixed(2)}`;
  } else {
    // If other format sensor size, directly use closestSensor
    effectiveSensorSize = closestSensor.name;
  }
  
  // Calculate equivalent aperture - Format to exactly 1 decimal place
  const equivalentAperture = parseFloat((aperture * newCropFactor).toFixed(1));
  
  // Calculate angle of view change - Format to 1 decimal place
  const angleOfViewChange = parseFloat((1 - (newFocalLength / originalFocalLength)) * 100).toFixed(1);
  
  // Calculate relative sensor area change - Format to 2 decimal places
  const relativeSensorArea = parseFloat((1 / areaRatio).toFixed(2));
  
  // Calculate equivalent focal length (relative to full frame) - Format to 1 decimal place
  const originalEquivalentFocalLength = parseFloat((originalFocalLength * originalCropFactor).toFixed(1));
  const newEquivalentFocalLength = parseFloat((newFocalLength * newCropFactor).toFixed(1));
  
  // Return result
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
      name: SENSORS[originalSensorId]?.name || "Unknown",
      cropFactor: originalCropFactor
    },
    angleOfViewChange: `${angleOfViewChange}%`,
    relativeSensorArea: relativeSensorArea,
    areaRatio: parseFloat(areaRatio.toFixed(2)),
    originalEquivalentFocalLength: originalEquivalentFocalLength,
    newEquivalentFocalLength: newEquivalentFocalLength
  };
}

/**
 * Update aperture calculation result UI
 */
function updateResultUI(data) {
  // Set result value
  resultSensor.textContent = data.sensorSize;
  resultCropFactor.textContent = data.cropFactor.toFixed(2);
  
  // Format aperture values to exactly one decimal place
  const inputAperture = typeof data.inputAperture === 'number' ? data.inputAperture.toFixed(1) : parseFloat(data.inputAperture).toFixed(1);
  const equivAperture = typeof data.equivalentAperture === 'number' ? data.equivalentAperture.toFixed(1) : parseFloat(data.equivalentAperture).toFixed(1);
  
  resultInputAperture.textContent = `f/${inputAperture}`;
  resultEquivalentAperture.textContent = `f/${equivAperture}`;
  
  // Show result container
  resultContainer.classList.remove("hidden");
  
  // Scroll to result area
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Update focal length equivalent calculation result UI
 */
function updateFocalResultUI(data) {
  // Sensor information
  document.getElementById("result-original-sensor").textContent = data.originalSensor.name;
  document.getElementById("result-original-crop").textContent = data.originalSensor.cropFactor.toFixed(2);
  
  // Update equivalent sensor information (focus on actual used sensor area)
  document.getElementById("result-equivalent-sensor").textContent = data.effectiveSensorSize || data.closestSensor.name;
  document.getElementById("result-new-crop").textContent = data.exactCropFactor.toFixed(2);
  
  // Lens performance
  document.getElementById("result-original-focal").textContent = `${data.originalFocalLength}mm`;
  document.getElementById("result-new-focal").textContent = `${data.newFocalLength}mm`;
  
  // Fix aperture display, keep one decimal place
  const aperture = data.aperture ? parseFloat(data.aperture).toFixed(1) : parseFloat(focalApertureInput.value).toFixed(1);
  const equivAperture = parseFloat(data.equivalentAperture).toFixed(1);
  
  document.getElementById("result-focal-aperture").textContent = `f/${aperture}`;
  document.getElementById("result-focal-equivalent-aperture").textContent = `f/${equivAperture}`;
  
  // Additional information - Use more intuitive designer-friendly labels
  document.getElementById("result-original-equiv-focal").textContent = `${data.originalEquivalentFocalLength}mm`;
  document.getElementById("result-new-equiv-focal").textContent = `${data.newEquivalentFocalLength}mm`;
  
  // Angle of view change percentage - Show more intuitive angle of view change
  document.getElementById("result-angle-change").textContent = data.angleOfViewChange;
  
  // Show actual used sensor area ratio
  document.getElementById("result-relative-area").textContent = `${data.relativeSensorArea}x`;
  
  // Show result container
  focalResultContainer.classList.remove("hidden");
  
  // Scroll to result area
  focalResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Show error message
 */
function showError(message) {
  console.error(message);
  
  // Show banner in offline mode
  connectionStatus.classList.remove("hidden");
}

/**
 * Check API connection
 */
async function checkApiConnection() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log("API connection established");
      connectionStatus.classList.add("hidden");
    } else {
      throw new Error("API health check failed");
    }
  } catch (error) {
    console.warn("API connection failed:", error.message);
    connectionStatus.classList.remove("hidden");
  }
}

// When DOM loaded, initialize app
document.addEventListener("DOMContentLoaded", initializeApp);

// Local sensor data, for fallback calculation when API fails
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
