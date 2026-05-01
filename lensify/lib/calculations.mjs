import { SENSORS } from "./sensors.mjs";

const FULL_FRAME_WIDTH_MM = 36;

function round(value, decimals = 1) {
  return Number(Number(value).toFixed(decimals));
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSensor(sensorId) {
  return SENSORS[sensorId] || null;
}

function getSensorWidthMm(cropFactor) {
  return FULL_FRAME_WIDTH_MM / cropFactor;
}

function getHorizontalAngleOfView(sensorWidthMm, focalLengthMm) {
  const radians = 2 * Math.atan(sensorWidthMm / (2 * focalLengthMm));
  return radians * (180 / Math.PI);
}

export function calculateApertureEquivalent(sensorId, aperture) {
  const sensor = getSensor(sensorId);
  const apertureValue = parsePositiveNumber(aperture);

  if (!sensor) {
    throw new Error("Invalid sensor size");
  }

  if (!apertureValue) {
    throw new Error("Invalid aperture value");
  }

  return {
    sensorSize: sensor.name,
    sensorId,
    cropFactor: round(sensor.cropFactor, 2),
    inputAperture: round(apertureValue, 1),
    equivalentAperture: round(apertureValue * sensor.cropFactor, 1)
  };
}

export function calculateFocalEquivalent(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  const sensor = getSensor(originalSensorId);
  const origFocal = parsePositiveNumber(originalFocalLength);
  const nextFocal = parsePositiveNumber(newFocalLength);
  const apertureValue = parsePositiveNumber(aperture);

  if (!sensor) {
    throw new Error("Invalid original sensor size");
  }

  if (!origFocal) {
    throw new Error("Invalid original focal length");
  }

  if (!nextFocal) {
    throw new Error("Invalid new focal length");
  }

  if (!apertureValue) {
    throw new Error("Invalid aperture value");
  }

  const cropFactor = sensor.cropFactor;
  const sensorWidthMm = getSensorWidthMm(cropFactor);
  const originalAngle = getHorizontalAngleOfView(sensorWidthMm, origFocal);
  const newAngle = getHorizontalAngleOfView(sensorWidthMm, nextFocal);
  const angleChange = ((newAngle / originalAngle) - 1) * 100;
  const perspectiveChange = ((nextFocal / origFocal) - 1) * 100;
  const relativeFramingArea = (origFocal / nextFocal) ** 2;

  return {
    originalSensor: {
      id: originalSensorId,
      name: sensor.name,
      cropFactor: round(cropFactor, 2)
    },
    originalFocalLength: round(origFocal, 1),
    newFocalLength: round(nextFocal, 1),
    inputAperture: round(apertureValue, 1),
    equivalentAperture: round(apertureValue * cropFactor, 1),
    originalEquivalentFocalLength: round(origFocal * cropFactor, 1),
    newEquivalentFocalLength: round(nextFocal * cropFactor, 1),
    originalHorizontalAngleOfView: round(originalAngle, 1),
    newHorizontalAngleOfView: round(newAngle, 1),
    angleOfViewChange: `${round(angleChange, 1)}%`,
    perspectiveChange: `${round(perspectiveChange, 1)}%`,
    relativeFramingArea: round(relativeFramingArea, 2)
  };
}
