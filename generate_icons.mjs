import sharp from 'sharp';
import fs from 'fs';

const svgBuffer = Buffer.from(`
<svg viewBox="0 0 24 24" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#10b981" />
  <path d="M12 4L18.5 7.75V16.25L12 20L5.5 16.25V7.75L12 4Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 4V20M12 12C14.5 12 16.5 10 16.5 7.5M12 12C9.5 12 7.5 14 7.5 16.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
`);

async function generate() {
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile('public/pwa-192x192.png');
    
  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile('public/pwa-512x512.png');
    
  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile('public/apple-touch-icon.png');
    
  console.log("Icons generated successfully.");
}

generate();
