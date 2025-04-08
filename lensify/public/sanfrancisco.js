/**
 * San Francisco JS - Lensify前端交互脚本
 * 
 * 这个脚本负责处理用户输入和与Cloudflare Worker API的交互
 * 获取计算结果并更新界面
 */

// Worker API的URL
// 自定义域名配置
const API_URL = "https://lensify.encveil.dev";

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
    
    // 构建API URL - 尝试不同的URL构建方式
    // 方式1: 原始URL(无路径)
    const url = `${API_URL}?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`;
    
    // 方式2: 添加/calculate路径(如果方式1不工作，可以尝试取消注释此行)
    // const url = `${API_URL}/calculate?sensorSize=${encodeURIComponent(sensorSize)}&aperture=${encodeURIComponent(aperture)}`;
    
    console.log("Requesting:", url); // 添加调试信息
    
    // 发送请求
    const response = await fetch(url);
    
    // 处理错误
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Calculation failed");
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 更新结果UI
    updateResultUI(data);
  } catch (error) {
    // 显示错误信息
    showError(error.message);
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
