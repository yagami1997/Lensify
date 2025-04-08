/**
 * Lensify - Sensor and Aperture Calculator
 * Cloudflare Worker implementation
 * 
 * 这个Worker实现了传感器尺寸和光圈转换的计算功能
 * 根据输入的传感器类型和光圈值，计算等效光圈
 */

// 传感器数据库 - 包含各种传感器尺寸和对应的裁切系数
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

// CORS头设置 - 允许跨域请求
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

/**
 * 计算不同焦距下的等效传感器和等效光圈
 * @param {string} originalSensorId - 原始传感器ID
 * @param {number} originalFocalLength - 原始焦距(mm)
 * @param {number} newFocalLength - 新焦距(mm)
 * @param {number} aperture - 光圈值
 * @returns {Object} - 计算结果
 */
function calculateEquivalentSensor(originalSensorId, originalFocalLength, newFocalLength, aperture) {
  // 获取原始传感器的裁切系数
  const originalCropFactor = SENSORS[originalSensorId].cropFactor;
  
  // 计算新的等效裁切系数
  const newCropFactor = parseFloat((originalCropFactor * (originalFocalLength / newFocalLength)).toFixed(2));
  
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
  
  // 计算等效光圈
  const equivalentAperture = parseFloat((aperture * newCropFactor).toFixed(2));
  
  // 计算视角变化百分比
  // 例如：从50mm到35mm，视角变化为 (1 - 35/50) * 100 = 30%，表示视角增加了30%
  const angleOfViewChange = parseFloat((1 - (newFocalLength / originalFocalLength)) * 100).toFixed(1);
  
  // 计算感光面积相对变化
  const relativeSensorArea = parseFloat(((originalCropFactor / newCropFactor) ** 2).toFixed(2));
  
  // 计算等效焦距（相对于全画幅）
  const originalEquivalentFocalLength = parseFloat((originalFocalLength * originalCropFactor).toFixed(1));
  const newEquivalentFocalLength = parseFloat((newFocalLength * newCropFactor).toFixed(1));
  
  // 返回结果
  return {
    exactCropFactor: newCropFactor,
    closestSensor: closestSensor,
    cropFactorDifference: parseFloat(minDifference.toFixed(3)),
    equivalentAperture: equivalentAperture,
    originalFocalLength: originalFocalLength,
    newFocalLength: newFocalLength,
    originalSensor: {
      id: originalSensorId,
      name: SENSORS[originalSensorId].name,
      cropFactor: originalCropFactor
    },
    angleOfViewChange: `${angleOfViewChange}%`,
    relativeSensorArea: relativeSensorArea,
    originalEquivalentFocalLength: originalEquivalentFocalLength,
    newEquivalentFocalLength: newEquivalentFocalLength
  };
}

/**
 * 处理API请求的主函数
 */
async function handleRequest(request) {
  // 添加健康检查端点
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理健康检查
  if (path === "/health" || path === "/") {
    return new Response(JSON.stringify({ status: "ok", version: "1.1.0" }), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-cache"
      }
    });
  }
  
  // 处理OPTIONS预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 调试信息：记录请求详情
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log("Request path:", path);
  
  // 检查是否是等效传感器计算请求
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
    
    // 验证参数
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
    
    // 计算等效传感器和光圈
    const result = calculateEquivalentSensor(
      originalSensorId,
      originalFocalLength,
      newFocalLength,
      aperture
    );
    
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }
  
  // 常规光圈等效计算
  // 获取传感器类型和光圈值参数
  const sensorSize = url.searchParams.get("sensorSize");
  const aperture = parseFloat(url.searchParams.get("aperture"));
  
  console.log("Aperture Equiv Params:", { sensorSize, aperture });

  // 验证参数
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

  // 获取传感器裁切系数
  const cropFactor = SENSORS[sensorSize].cropFactor;
  
  // 计算等效光圈
  const equivalentAperture = parseFloat((aperture * cropFactor).toFixed(2));

  // 返回计算结果
  const result = {
    sensorSize: SENSORS[sensorSize].name,
    sensorId: sensorSize,
    cropFactor: cropFactor,
    inputAperture: aperture,
    equivalentAperture: equivalentAperture
  };

  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

// 注册Worker的fetch事件处理程序
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
