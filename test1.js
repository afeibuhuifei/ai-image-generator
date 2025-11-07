const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const url = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

// 生成时间戳用于文件名
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// 下载图片并保存到本地
function downloadImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https:') ? https : http;

    protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP error! status: ${response.statusCode}`));
        return;
      }

      const filePath = path.join(__dirname, filename);
      const fileStream = fs.createWriteStream(filePath);

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`图片已保存到: ${filePath}`);
        resolve(filePath);
      });

      fileStream.on('error', (error) => {
        fs.unlink(filePath, () => {}); // 删除部分下载的文件
        reject(error);
      });
    }).on('error', reject);
  });
}

async function generateAndSaveImage() {
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 71900077ef354082a217e1a88a0319e9.FVEUVzVJJNRMymHf',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "cogview-4-250304",
      prompt: "a cute cat on lovely sofa",
      size: "1024x1024",
      quality: "standard"
    })
  };

  try {
    console.log('正在生成图片...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageUrl = data.data[0].url;
      const timestamp = generateTimestamp();
      const filename = `generated_image_${timestamp}.png`;

      console.log('图片生成成功，开始下载...');
      console.log('图片URL:', imageUrl);

      const savedPath = await downloadImage(imageUrl, filename);
      console.log('图片下载完成！');
      console.log('文件路径:', savedPath);
    } else {
      console.error('生成图片失败:', data);
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 执行函数
generateAndSaveImage();