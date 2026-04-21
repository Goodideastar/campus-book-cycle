// 检查本地存储中的用户信息
const fs = require('fs');
const path = require('path');

// 本地存储文件路径（假设在Chrome浏览器中）
const localStoragePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb');

console.log('Checking local storage for picsum.photos URLs...');

// 读取本地存储文件
if (fs.existsSync(localStoragePath)) {
  const files = fs.readdirSync(localStoragePath);
  files.forEach(file => {
    if (file.endsWith('.log') || file.endsWith('.ldb')) {
      try {
        const content = fs.readFileSync(path.join(localStoragePath, file), 'utf8');
        if (content.includes('picsum.photos')) {
          console.log(`Found picsum.photos in file: ${file}`);
          // 提取包含picsum.photos的行
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('picsum.photos')) {
              console.log(`Line ${index + 1}: ${line.substring(0, 200)}...`);
            }
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error.message);
      }
    }
  });
} else {
  console.log('Local storage directory not found.');
}

console.log('Check completed.');
