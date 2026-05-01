/**
 * San Francisco JS - Lensify Frontend Interaction Script
 */

const API_BASE = "/api";

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

function initializeApp() {
  if (!sensorSelect || !apertureInput || !calculateButton) {
    console.error("Missing essential DOM elements for aperture calculator");
    return;
  }

  calculateButton.addEventListener("click", calculateEquivalentAperture);

  const hasFocalTab =
    tabButtonFocal &&
    tabButtonAperture &&
    tabAperture &&
    tabFocal &&
    originalSensorSelect &&
    originalFocalInput &&
    newFocalInput &&
    focalApertureInput &&
    calculateFocalButton;

  if (hasFocalTab) {
    calculateFocalButton.addEventListener("click", calculateFocalEquivalent);
    tabButtonAperture.addEventListener("click", () => switchTab("aperture"));
    tabButtonFocal.addEventListener("click", () => switchTab("focal"));
    focalApertureInput.addEventListener("keyup", onEnter(calculateFocalEquivalent));
    originalFocalInput.addEventListener("input", validateFocalLengthInput);
    newFocalInput.addEventListener("input", validateFocalLengthInput);
    focalApertureInput.addEventListener("input", validateApertureInput);
    switchTab("aperture");
  }

  apertureInput.addEventListener("keyup", onEnter(calculateEquivalentAperture));
  apertureInput.addEventListener("input", validateApertureInput);
  checkApiConnection();
}

function onEnter(handler) {
  return function onKeyup(event) {
    if (event.key === "Enter") {
      handler();
    }
  };
}

function switchTab(tabName) {
  if (!tabButtonAperture || !tabButtonFocal || !tabAperture || !tabFocal) {
    return;
  }

  tabButtonAperture.classList.remove("active");
  tabButtonFocal.classList.remove("active");
  tabAperture.classList.remove("active");
  tabFocal.classList.remove("active");

  if (tabName === "aperture") {
    tabButtonAperture.classList.add("active");
    tabAperture.classList.add("active");
  } else if (tabName === "focal") {
    tabButtonFocal.classList.add("active");
    tabFocal.classList.add("active");
  }
}

function validateApertureInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);

  if (!Number.isFinite(value) || value <= 0) {
    input.setCustomValidity("Please enter a positive number");
    input.reportValidity();
    return false;
  }

  input.setCustomValidity("");
  return true;
}

function validateFocalLengthInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);

  if (!Number.isFinite(value) || value <= 0) {
    input.setCustomValidity("Please enter a positive number");
    input.reportValidity();
    return false;
  }

  input.setCustomValidity("");
  return true;
}

async function fetchJson(url) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const message = `API returned ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

async function calculateEquivalentAperture() {
  if (!validateApertureInput({ target: apertureInput })) {
    return;
  }

  const sensorSize = sensorSelect.value;
  const aperture = parseFloat(apertureInput.value);

  try {
    calculateButton.disabled = true;
    calculateButton.textContent = "Calculating...";

    const data = await fetchJson(
      `${API_BASE}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`
    );

    updateResultUI(data);
  } catch (error) {
    showError(error.message || "Unknown error");

    const fallbackCropFactor = SENSORS[sensorSize]?.cropFactor || 1.0;
    updateResultUI({
      sensorSize: SENSORS[sensorSize]?.name || "Unknown",
      cropFactor: fallbackCropFactor,
      inputAperture: aperture,
      equivalentAperture: parseFloat((aperture * fallbackCropFactor).toFixed(1))
    });
  } finally {
    calculateButton.disabled = false;
    calculateButton.textContent = "Calculate";
  }
}

async function calculateFocalEquivalent() {
  if (!validateApertureInput({ target: focalApertureInput })) {
    return;
  }

  if (!validateFocalLengthInput({ target: originalFocalInput })) {
    return;
  }

  if (!validateFocalLengthInput({ target: newFocalInput })) {
    return;
  }

  const originalSensor = originalSensorSelect.value;
  const originalFocal = parseFloat(originalFocalInput.value);
  const newFocal = parseFloat(newFocalInput.value);
  const aperture = parseFloat(focalApertureInput.value);

  try {
    calculateFocalButton.disabled = true;
    calculateFocalButton.textContent = "Calculating...";

    const data = await fetchJson(
      `${API_BASE}/focal-equiv?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`
    );

    updateFocalResultUI(data);
  } catch (error) {
    showError(error.message || "Unknown error");
    updateFocalResultUI(
      calculateLocalFocalEquivalent(originalSensor, originalFocal, newFocal, aperture)
    );
  } finally {
    calculateFocalButton.disabled = false;
    calculateFocalButton.textContent = "Calculate";
  }
}

function calculateLocalFocalEquivalent(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  const originalCropFactor = SENSORS[originalSensorId]?.cropFactor || 1.0;
  const sensorWidth = 36 / originalCropFactor;
  const originalAngle = 2 * Math.atan(sensorWidth / (2 * originalFocalLength)) * (180 / Math.PI);
  const newAngle = 2 * Math.atan(sensorWidth / (2 * newFocalLength)) * (180 / Math.PI);
  const equivalentAperture = parseFloat((aperture * originalCropFactor).toFixed(1));
  const angleOfViewChange = (((newAngle / originalAngle) - 1) * 100).toFixed(1);
  const perspectiveChange = (((newFocalLength / originalFocalLength) - 1) * 100).toFixed(1);
  const relativeFramingArea = ((originalFocalLength / newFocalLength) ** 2).toFixed(2);
  const originalEquivalentFocalLength = parseFloat((originalFocalLength * originalCropFactor).toFixed(1));
  const newEquivalentFocalLength = parseFloat((newFocalLength * originalCropFactor).toFixed(1));

  return {
    originalSensor: {
      id: originalSensorId,
      name: SENSORS[originalSensorId]?.name || "Unknown",
      cropFactor: originalCropFactor
    },
    originalFocalLength,
    newFocalLength,
    inputAperture: parseFloat(aperture.toFixed(1)),
    equivalentAperture,
    originalEquivalentFocalLength,
    newEquivalentFocalLength,
    originalHorizontalAngleOfView: parseFloat(originalAngle.toFixed(1)),
    newHorizontalAngleOfView: parseFloat(newAngle.toFixed(1)),
    angleOfViewChange: `${angleOfViewChange}%`,
    perspectiveChange: `${perspectiveChange}%`,
    relativeFramingArea: parseFloat(relativeFramingArea)
  };
}

function updateResultUI(data) {
  resultSensor.textContent = data.sensorSize;
  resultCropFactor.textContent = data.cropFactor.toFixed(2);
  resultInputAperture.textContent = `f/${data.inputAperture.toFixed(1)}`;
  resultEquivalentAperture.textContent = `f/${data.equivalentAperture.toFixed(1)}`;
  resultContainer.classList.remove("hidden");
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateFocalResultUI(data) {
  document.getElementById("result-original-sensor").textContent = data.originalSensor.name;
  document.getElementById("result-original-crop").textContent = data.originalSensor.cropFactor.toFixed(2);
  document.getElementById("result-focal-aperture").textContent = `f/${data.inputAperture.toFixed(1)}`;
  document.getElementById("result-focal-equivalent-aperture").textContent = `f/${data.equivalentAperture.toFixed(1)}`;
  document.getElementById("result-original-focal").textContent = `${data.originalFocalLength}mm`;
  document.getElementById("result-new-focal").textContent = `${data.newFocalLength}mm`;
  document.getElementById("result-original-aov").textContent = `${data.originalHorizontalAngleOfView.toFixed(1)}°`;
  document.getElementById("result-new-aov").textContent = `${data.newHorizontalAngleOfView.toFixed(1)}°`;
  document.getElementById("result-original-equiv-focal").textContent = `${data.originalEquivalentFocalLength}mm`;
  document.getElementById("result-new-equiv-focal").textContent = `${data.newEquivalentFocalLength}mm`;
  document.getElementById("result-angle-change").textContent = data.angleOfViewChange;
  document.getElementById("result-perspective-change").textContent = data.perspectiveChange;
  document.getElementById("result-relative-area").textContent = `${data.relativeFramingArea}x`;
  focalResultContainer.classList.remove("hidden");
  focalResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(message) {
  console.error(message);
  connectionStatus.classList.remove("hidden");
}

async function checkApiConnection() {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: "GET" });
    const data = response.ok ? await response.json() : null;

    if (response.ok && data?.status === "ok") {
      connectionStatus.classList.add("hidden");
    } else {
      connectionStatus.classList.remove("hidden");
    }
  } catch (error) {
    connectionStatus.classList.remove("hidden");
    console.error("API connection check failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);

const SENSORS = {
  "medium-format": { cropFactor: 0.7, name: "Medium Format" },
  "full-frame": { cropFactor: 1.0, name: "Full Frame" },
  "aps-h": { cropFactor: 1.3, name: "APS-H" },
  "aps-c-canon": { cropFactor: 1.6, name: "APS-C (Canon)" },
  "aps-c": { cropFactor: 1.5, name: "APS-C" },
  "micro-four-thirds": { cropFactor: 2.0, name: "Micro Four Thirds" },
  "1-inch": { cropFactor: 2.7, name: "1-inch" },
  "1/1.12": { cropFactor: 3.03, name: "1/1.12-inch" },
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
