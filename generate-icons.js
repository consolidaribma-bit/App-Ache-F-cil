import fs from 'fs';
import sharp from 'sharp';

const inputPath = 'C:/Users/eduka/.gemini/antigravity/brain/06e16df2-a885-40bc-9479-200016660172/media__1783391851856.png';
const publicDir = './public';

async function generate() {
  console.log("Copying original logo...");
  fs.copyFileSync(inputPath, `${publicDir}/logo.png`);
  
  console.log("Generating 192x192 icon...");
  await sharp(inputPath).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(`${publicDir}/logo-192.png`);
  
  console.log("Generating 512x512 icon...");
  await sharp(inputPath).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(`${publicDir}/logo-512.png`);
  
  console.log("Generating maskable icon...");
  await sharp(inputPath).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFile(`${publicDir}/logo-maskable.png`);
  
  console.log("Icons generated successfully");
}

generate().catch(console.error);
