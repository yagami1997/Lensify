// 计算视角变化百分比
// 例如：从50mm到35mm，视角变化为 (1 - 35/50) * 100 = 30%，表示视角增加了30%
const angleOfViewChange = parseFloat((1 - (newFocalLength / originalFocalLength)) * 100).toFixed(1);

// 计算感光面积相对变化 