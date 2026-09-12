const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer from RGBA data
function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with 0x00 filter byte
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;

  for (let y = 0; y < height; y++) {
    scanlines.writeUInt8(0, dstOffset++); // Filter type: None
    rgbaBuffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const idatCompressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = zlib.crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc >>> 0, 8 + length);
  return chunk;
}

// Generate stylized game icon
function renderIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = isMaskable ? size * 0.44 : size * 0.46;
  const innerR = outerR * 0.72;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Deep radial blue background
      const normDist = dist / (size * 0.707);
      let r = Math.round(2 + normDist * 10);
      let g = Math.round(4 + normDist * 20);
      let b = Math.round(36 + (1 - normDist) * 85);
      let a = 255;

      // Outer gold ring
      const ringWidth = size * 0.04;
      if (Math.abs(dist - outerR) < ringWidth) {
        const ringNorm = 1 - Math.abs(dist - outerR) / ringWidth;
        r = Math.round(234 * ringNorm + r * (1 - ringNorm));
        g = Math.round(179 * ringNorm + g * (1 - ringNorm));
        b = Math.round(8 * ringNorm + b * (1 - ringNorm));
      }

      // Radiating spokes (16 rays)
      if (dist > innerR && dist < outerR) {
        const spoke = Math.cos(angle * 16);
        if (spoke > 0.85) {
          const spokeIntensity = (spoke - 0.85) / 0.15;
          r = Math.min(255, r + Math.round(120 * spokeIntensity));
          g = Math.min(255, g + Math.round(100 * spokeIntensity));
          b = Math.min(255, b + Math.round(30 * spokeIntensity));
        }
      }

      // Inner medallion ring
      const innerRingWidth = size * 0.025;
      if (Math.abs(dist - innerR) < innerRingWidth) {
        const iNorm = 1 - Math.abs(dist - innerR) / innerRingWidth;
        r = Math.round(250 * iNorm + r * (1 - iNorm));
        g = Math.round(204 * iNorm + g * (1 - iNorm));
        b = Math.round(21 * iNorm + b * (1 - iNorm));
      }

      // Inside central medallion: subtle bright highlight
      if (dist < innerR) {
        const innerHighlight = (1 - dist / innerR);
        r = Math.min(255, r + Math.round(40 * innerHighlight));
        g = Math.min(255, g + Math.round(60 * innerHighlight));
        b = Math.min(255, b + Math.round(140 * innerHighlight));

        // Center stylized mathematical symbol "12" or "TP"
        // Draw centered diamond cross / star
        const diamondDist = Math.abs(dx) + Math.abs(dy);
        if (diamondDist < innerR * 0.5) {
          const dVal = 1 - diamondDist / (innerR * 0.5);
          r = Math.min(255, Math.round(245 * dVal + r * (1 - dVal)));
          g = Math.min(255, Math.round(190 * dVal + g * (1 - dVal)));
          b = Math.min(255, Math.round(15 * dVal + b * (1 - dVal)));
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return createPNG(size, size, buf);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderIcon(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), renderIcon(64, false));
console.log('Successfully generated all PWA icons in /public!');
