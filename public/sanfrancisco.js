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

// DOM元素
const sensorSelect = document.getElementById("sensorSize");
const apertureInput = document.getElementById("aperture");
const calculateButton = document.getElementById("calculate");
const resultContainer = document.getElementById("result");
const resultSensor = document.getElementById("result-sensor");
const resultCropFactor = document.getElementById("result-crop-factor");
const resultInputAperture = document.getElementById("result-input-aperture");
const resultEquivalentAperture = document.getElementById("result-equivalent-aperture");
const connectionStatus = document.getElementById("connection-status");

/**
 * 初始化页面交互
 */
function initializeApp() {
  // 添加计算按钮点击事件
  calculateButton.addEventListener("click", calculateEquivalentAperture);
  
  // 添加键盘事件 - 按Enter键时触发计算
  apertureInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      calculateEquivalentAperture();
    }
  });
  
  // 添加输入验证
  apertureInput.addEventListener("input", validateApertureInput);
  
  // 检查API连接
  checkApiConnection();
}

/**
 * 光圈输入验证
 */
function validateApertureInput() {
  const value = parseFloat(apertureInput.value);
  
  // 确保光圈值为正数
  if (isNaN(value) || value <= 0) {
    apertureInput.setCustomValidity("Please enter a positive number");
    apertureInput.reportValidity();
    return false;
  }
  
  apertureInput.setCustomValidity("");
  return true;
}

/**
 * 调用Worker API计算等效光圈
 */
async function calculateEquivalentAperture() {
  // 验证输入
  if (!validateApertureInput()) {
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
 * 更新结果UI
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
 * 显示错误信息
 */
function showError(message) {
  alert(`Error: ${message}`);
}

// 当DOM加载完成后初始化应用
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * 本地开发模式检测
 * 在本地开发时使用模拟数据，方便调试
 */
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("Development mode: Using mock API");
  
  // 覆盖API调用函数，使用模拟数据
  window.calculateEquivalentAperture = async function() {
    // 验证输入
    if (!validateApertureInput()) {
      return;
    }
    
    // 获取用户输入
    const sensorSize = sensorSelect.value;
    const aperture = parseFloat(apertureInput.value);
    
    // 模拟API响应延迟
    calculateButton.disabled = true;
    calculateButton.textContent = "Calculating...";
    
    // 模拟裁切系数查找
    const sensorMap = {
      "medium-format": { cropFactor: 0.7, name: "Medium Format" },
      "full-frame": { cropFactor: 1.0, name: "Full Frame" },
      "aps-h": { cropFactor: 1.3, name: "APS-H" },
      "aps-c-canon": { cropFactor: 1.6, name: "APS-C (Canon)" },
      "aps-c": { cropFactor: 1.5, name: "APS-C" },
      "micro-four-thirds": { cropFactor: 2.0, name: "Micro Four Thirds" },
      "1-inch": { cropFactor: 2.7, name: "1-inch" }
    };
    
    // 获取对应传感器信息，如果没找到则使用默认值
    const sensorInfo = sensorMap[sensorSize] || { cropFactor: 1.0, name: "Unknown" };
    
    // 模拟计算
    const equivalentAperture = parseFloat((aperture * sensorInfo.cropFactor).toFixed(2));
    
    // 构建模拟响应数据
    const mockResponse = {
      sensorSize: sensorInfo.name,
      cropFactor: sensorInfo.cropFactor,
      inputAperture: aperture,
      equivalentAperture: equivalentAperture
    };
    
    // 模拟延迟
    setTimeout(() => {
      updateResultUI(mockResponse);
      calculateButton.disabled = false;
      calculateButton.textContent = "Calculate";
    }, 500);
  };
}

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

/**
 * 检查API连接状态
 */
async function checkApiConnection() {
  try {
    // 尝试连接API健康检查端点
    const response = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (response.ok) {
      console.log("API connection successful");
      connectionStatus.classList.add("hidden");
    } else {
      throw new Error("API health check failed");
    }
  } catch (error) {
    console.warn("API connection failed:", error);
    connectionStatus.classList.remove("hidden");
  }
}
