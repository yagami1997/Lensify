/**
 * San Francisco JS - Lensify前端交互脚本
 * 
 * 这个脚本负责处理用户输入和与Cloudflare Worker API的交互
 * 获取计算结果并更新界面
 */

// Worker API的URL配置 - 支持多种URL格式以增加兼容性
const API_URL = "https://lensify.encveil.dev";
const FALLBACK_URL = "https://lensify-calculator.workers.dev";

// 自定义路由URL示例（根据您的实际配置选择一种并取消注释）
// const API_URL = "https://api.example.com";                   // 如果使用 api.example.com/calculate*
// const API_URL = "https://example.com/api";                // 如果使用 example.com/api/calculate*
// const API_URL = "https://calculator.example.com";         // 如果使用 calculator.example.com/*
// const API_URL = "https://example.com/tools/lensify";      // 如果使用 example.com/tools/lensify/*

// DOM元素 - 光圈计算器
const sensorSelect = document.getElementById("sensorSize");
const apertureInput = document.getElementById("aperture");
const calculateButton = document.getElementById("calculate");
const resultContainer = document.getElementById("result");
const resultSensor = document.getElementById("result-sensor");
const resultCropFactor = document.getElementById("result-crop-factor");
const resultInputAperture = document.getElementById("result-input-aperture");
const resultEquivalentAperture = document.getElementById("result-equivalent-aperture");
const connectionStatus = document.getElementById("connection-status");

// DOM元素 - 焦距等效计算器
const originalSensorSelect = document.getElementById("originalSensor");
const originalFocalInput = document.getElementById("originalFocal");
const newFocalInput = document.getElementById("newFocal");
const focalApertureInput = document.getElementById("focalAperture");
const calculateFocalButton = document.getElementById("calculateFocal");
const focalResultContainer = document.getElementById("focalResult");

// DOM元素 - 标签页
const tabButtonAperture = document.getElementById("tab-button-aperture");
const tabButtonFocal = document.getElementById("tab-button-focal");
const tabAperture = document.getElementById("tab-aperture");
const tabFocal = document.getElementById("tab-focal");

/**
 * 初始化页面交互
 */
function initializeApp() {
  console.log("Initializing app...");
  
  // 首先检查DOM元素是否存在
  if (!sensorSelect || !apertureInput || !calculateButton) {
    console.error("Missing essential DOM elements for aperture calculator");
    return;
  }
  
  // 添加计算按钮点击事件
  calculateButton.addEventListener("click", calculateEquivalentAperture);
  
  // 检查焦距计算器元素是否存在
  const hasFocalTab = tabButtonFocal && tabButtonAperture && tabAperture && tabFocal && 
                      originalSensorSelect && originalFocalInput && newFocalInput && 
                      focalApertureInput && calculateFocalButton;
  
  if (hasFocalTab) {
    console.log("Focal length tab elements found, initializing...");
    
    // 添加焦距计算功能
    calculateFocalButton.addEventListener("click", calculateFocalEquivalent);
    
    // 添加标签页切换事件
    tabButtonAperture.addEventListener("click", () => switchTab("aperture"));
    tabButtonFocal.addEventListener("click", () => switchTab("focal"));
    
    // 添加键盘事件 - 焦距计算器
    focalApertureInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        calculateFocalEquivalent();
      }
    });
    
    // 添加输入验证 - 焦距计算器
    focalApertureInput.addEventListener("input", validateApertureInput);
    originalFocalInput.addEventListener("input", validateFocalLengthInput);
    newFocalInput.addEventListener("input", validateFocalLengthInput);
    
    // 初始化时默认显示光圈计算器标签页
    switchTab("aperture");
  } else {
    console.warn("Focal length calculator elements not found, using aperture calculator only mode");
  }
  
  // 添加键盘事件 - 光圈计算器
  apertureInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      calculateEquivalentAperture();
    }
  });
  
  // 添加输入验证 - 光圈计算器
  apertureInput.addEventListener("input", validateApertureInput);
  
  // 检查API连接
  checkApiConnection();
}

/**
 * 切换标签页
 */
function switchTab(tabName) {
  console.log(`Switching to tab: ${tabName}`);
  
  // 检查所有标签页元素是否存在
  if (!tabButtonAperture || !tabButtonFocal || !tabAperture || !tabFocal) {
    console.error("Tab elements missing, cannot switch tabs");
    return;
  }
  
  // 移除所有标签页的active类
  tabButtonAperture.classList.remove("active");
  tabButtonFocal.classList.remove("active");
  tabAperture.classList.remove("active");
  tabFocal.classList.remove("active");
  
  // 添加active类到选中的标签页
  if (tabName === "aperture") {
    tabButtonAperture.classList.add("active");
    tabAperture.classList.add("active");
  } else if (tabName === "focal") {
    tabButtonFocal.classList.add("active");
    tabFocal.classList.add("active");
  }
}

/**
 * 光圈输入验证
 */
function validateApertureInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);
  
  // 确保光圈值为正数
  if (isNaN(value) || value <= 0) {
    input.setCustomValidity("Please enter a positive number");
    input.reportValidity();
    return false;
  }
  
  input.setCustomValidity("");
  return true;
}

/**
 * 焦距输入验证
 */
function validateFocalLengthInput(event) {
  const input = event?.target || this;
  const value = parseFloat(input.value);
  
  // 确保焦距为正整数
  if (isNaN(value) || value <= 0 || !Number.isInteger(value)) {
    input.setCustomValidity("Please enter a positive integer");
    input.reportValidity();
    return false;
  }
  
  input.setCustomValidity("");
  return true;
}

/**
 * 调用Worker API计算等效光圈
 */
async function calculateEquivalentAperture() {
  // 验证输入
  if (!validateApertureInput({ target: apertureInput })) {
    return;
  }
  
  // 获取用户输入
  const sensorSize = sensorSelect.value;
  const aperture = parseFloat(apertureInput.value);
  
  try {
    // 禁用按钮，显示加载状态
    calculateButton.disabled = true;
    calculateButton.textContent = "Calculating...";
    
    // 使用多种URL格式尝试，增加成功率
    let response;
    let error;
    
    // 尝试几种不同的URL格式
    const urlFormats = [
      `${API_URL}?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/health`,
      `${FALLBACK_URL}?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`
    ];
    
    // 依次尝试不同的URL
    for (const url of urlFormats) {
      try {
        console.log("Trying URL:", url);
        response = await fetch(url, { method: 'GET' });
        
        if (response.ok) {
          console.log("Success with URL:", url);
          // 找到可工作的URL，退出循环
          break;
        }
      } catch (e) {
        console.log("Failed with URL:", url, e.message);
        error = e;
        // 继续尝试下一个URL
      }
    }
    
    // 如果没有可工作的URL，抛出最后的错误
    if (!response || !response.ok) {
      throw error || new Error("All API endpoints failed");
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 如果是健康检查响应，使用模拟数据
    if (data.status === "ok" && data.version) {
      console.log("Received health check response, using mock data");
      const mockData = {
        sensorSize: SENSORS[sensorSize]?.name || "Unknown",
        cropFactor: SENSORS[sensorSize]?.cropFactor || 1.0,
        inputAperture: aperture,
        equivalentAperture: aperture * (SENSORS[sensorSize]?.cropFactor || 1.0)
      };
      updateResultUI(mockData);
      return;
    }
    
    // 更新结果UI
    updateResultUI(data);
  } catch (error) {
    // 显示错误信息
    showError(`请求失败: ${error.message || '未知错误'}`);
    
    // 如果API请求失败，使用本地计算
    console.log("API request failed, using local calculation");
    const fallbackCropFactor = SENSORS[sensorSize]?.cropFactor || 1.0;
    const fallbackData = {
      sensorSize: SENSORS[sensorSize]?.name || "Unknown",
      cropFactor: fallbackCropFactor,
      inputAperture: aperture,
      equivalentAperture: parseFloat((aperture * fallbackCropFactor).toFixed(2))
    };
    updateResultUI(fallbackData);
  } finally {
    // 恢复按钮状态
    calculateButton.disabled = false;
    calculateButton.textContent = "Calculate";
  }
}

/**
 * 计算焦距等效
 */
async function calculateFocalEquivalent() {
  // 验证输入
  if (!validateApertureInput({ target: focalApertureInput })) {
    return;
  }
  
  if (!validateFocalLengthInput({ target: originalFocalInput })) {
    return;
  }
  
  if (!validateFocalLengthInput({ target: newFocalInput })) {
    return;
  }
  
  // 获取用户输入
  const originalSensor = originalSensorSelect.value;
  const originalFocal = parseInt(originalFocalInput.value);
  const newFocal = parseInt(newFocalInput.value);
  const aperture = parseFloat(focalApertureInput.value);
  
  try {
    // 禁用按钮，显示加载状态
    calculateFocalButton.disabled = true;
    calculateFocalButton.textContent = "Calculating...";
    
    // 尝试几种不同的URL格式
    const urlFormats = [
      `${API_URL}/focal-equiv?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${API_URL}/focal-equivalent?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/focal-equiv?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`,
      `${FALLBACK_URL}/focal-equivalent?originalSensor=${encodeURIComponent(originalSensor)}&originalFocal=${encodeURIComponent(originalFocal)}&newFocal=${encodeURIComponent(newFocal)}&aperture=${encodeURIComponent(aperture)}`
    ];
    
    let response;
    let error;
    
    // 依次尝试不同的URL
    for (const url of urlFormats) {
      try {
        console.log("Trying URL:", url);
        response = await fetch(url, { method: 'GET' });
        
        if (response.ok) {
          console.log("Success with URL:", url);
          // 找到可工作的URL，退出循环
          break;
        }
      } catch (e) {
        console.log("Failed with URL:", url, e.message);
        error = e;
        // 继续尝试下一个URL
      }
    }
    
    // 如果没有可工作的URL，使用本地计算
    if (!response || !response.ok) {
      console.log("All API endpoints failed, using local calculation");
      const result = calculateLocalFocalEquivalent(originalSensor, originalFocal, newFocal, aperture);
      updateFocalResultUI({...result, aperture});
      return;
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 添加原始光圈值以便UI显示
    data.aperture = aperture;
    
    // 更新结果UI
    updateFocalResultUI(data);
  } catch (error) {
    // 显示错误信息
    showError(`请求失败: ${error.message || '未知错误'}`);
    
    // 使用本地计算
    const result = calculateLocalFocalEquivalent(originalSensor, originalFocal, newFocal, aperture);
    updateFocalResultUI({...result, aperture});
  } finally {
    // 恢复按钮状态
    calculateFocalButton.disabled = false;
    calculateFocalButton.textContent = "Calculate";
  }
}

/**
 * 本地计算焦距等效
 */
function calculateLocalFocalEquivalent(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  // 获取原始传感器的裁切系数
  const originalCropFactor = SENSORS[originalSensorId]?.cropFactor || 1.0;
  
  // 计算数码变焦下的实际使用传感器面积比例
  const areaRatio = (newFocalLength / originalFocalLength) ** 2;
  
  // 计算新的等效裁切系数
  const newCropFactor = parseFloat((originalCropFactor * (newFocalLength / originalFocalLength)).toFixed(2));
  
  // 找到最接近的传感器
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
  
  // 计算当前实际等效的传感器尺寸
  let effectiveSensorSize;
  if (originalSensorId.startsWith("1/")) {
    // 如果原始传感器是1/x形式
    const originalDenominator = parseFloat(originalSensorId.substring(2));
    const newDenominator = originalDenominator * Math.sqrt(areaRatio);
    effectiveSensorSize = `1/${newDenominator.toFixed(2)}`;
  } else {
    // 如果是其他形式的传感器尺寸，直接使用closestSensor
    effectiveSensorSize = closestSensor.name;
  }
  
  // 计算等效光圈
  const equivalentAperture = parseFloat((aperture * newCropFactor).toFixed(1));
  
  // 计算视角变化
  const angleOfViewChange = parseFloat((1 - (newFocalLength / originalFocalLength)) * 100).toFixed(1);
  
  // 计算感光面积相对变化
  const relativeSensorArea = parseFloat((1 / areaRatio).toFixed(2));
  
  // 计算等效焦距（相对于全画幅）
  const originalEquivalentFocalLength = parseFloat((originalFocalLength * originalCropFactor).toFixed(1));
  const newEquivalentFocalLength = parseFloat((newFocalLength * newCropFactor).toFixed(1));
  
  // 返回结果
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
 * 更新光圈计算结果UI
 */
function updateResultUI(data) {
  // 设置结果值
  resultSensor.textContent = data.sensorSize;
  resultCropFactor.textContent = data.cropFactor.toFixed(2);
  resultInputAperture.textContent = `f/${data.inputAperture.toFixed(1)}`;
  resultEquivalentAperture.textContent = `f/${data.equivalentAperture.toFixed(1)}`;
  
  // 显示结果容器
  resultContainer.classList.remove("hidden");
  
  // 滚动到结果区域
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * 更新焦距等效计算结果UI
 */
function updateFocalResultUI(data) {
  // 传感器信息
  document.getElementById("result-original-sensor").textContent = data.originalSensor.name;
  document.getElementById("result-original-crop").textContent = data.originalSensor.cropFactor.toFixed(2);
  
  // 更新等效传感器信息（重点显示实际使用的感光面积）
  document.getElementById("result-equivalent-sensor").textContent = data.effectiveSensorSize || data.closestSensor.name;
  document.getElementById("result-new-crop").textContent = data.exactCropFactor.toFixed(2);
  
  // 镜头性能
  document.getElementById("result-original-focal").textContent = `${data.originalFocalLength}mm`;
  document.getElementById("result-new-focal").textContent = `${data.newFocalLength}mm`;
  
  // 修复光圈显示，保留一位小数
  document.getElementById("result-focal-aperture").textContent = `f/${data.aperture ? data.aperture.toFixed(1) : focalApertureInput.value}`;
  document.getElementById("result-focal-equivalent-aperture").textContent = `f/${data.equivalentAperture.toFixed(1)}`;
  
  // 附加信息 - 使用更直观的设计师友好标签
  document.getElementById("result-original-equiv-focal").textContent = `${data.originalEquivalentFocalLength}mm`;
  document.getElementById("result-new-equiv-focal").textContent = `${data.newEquivalentFocalLength}mm`;
  
  // 视角变化百分比 - 显示更直观的视角变化
  document.getElementById("result-angle-change").textContent = data.angleOfViewChange;
  
  // 显示实际使用的传感器面积比例
  document.getElementById("result-relative-area").textContent = `${data.relativeSensorArea}x`;
  
  // 显示结果容器
  focalResultContainer.classList.remove("hidden");
  
  // 滚动到结果区域
  focalResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * 显示错误信息
 */
function showError(message) {
  console.error(message);
  
  // 在线下模式下显示横幅
  connectionStatus.classList.remove("hidden");
}

/**
 * 检查API连接
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

// 当DOM加载完成后初始化应用
document.addEventListener("DOMContentLoaded", initializeApp);

// 本地传感器数据，用于API失败时的回退计算
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
