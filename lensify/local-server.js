/**
 * local-server.js - 本地开发服务器
 * 
 * 这个简单的HTTP服务器用于本地测试Lensify项目
 * 使用方法: node local-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 端口配置
const PORT = 3000;

// MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // 解析URL
  let url = req.url;
  
  // 处理根路径请求
  if (url === '/') {
    url = '/yosemite.html';
  }
  
  // 文件路径
  const filePath = path.join(__dirname, 'public', url);
  
  // 获取文件扩展名
  const extname = path.extname(filePath);
  
  // 默认Content-Type
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        console.error(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // 服务器错误
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // 成功读取文件
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
}); 