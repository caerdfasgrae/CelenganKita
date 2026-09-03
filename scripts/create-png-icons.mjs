import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createEmeraldPng(size) {
  const width = size;
  const height = size;
  
  // IHDR: width(4), height(4), bitDepth(1)=8, colorType(1)=6 (RGBA), comp(1)=0, filter(1)=0, interlace(1)=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk("IHDR", ihdrData);

  // Scanlines: each row starts with filter byte 0, followed by width * 4 bytes (RGBA)
  // Color: Emerald Green #10B981 (16, 185, 129, 255) with rounded corners
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const radius = size * 0.25;
  const center = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // Filter type 0

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Check rounded rect boundary
      const dx = Math.abs(x - center) - (center - radius);
      const dy = Math.abs(y - center) - (center - radius);
      const isOutside = (dx > 0 && dy > 0 && Math.sqrt(dx * dx + dy * dy) > radius);

      if (isOutside) {
        rawData.writeUInt8(0, pixelOffset);
        rawData.writeUInt8(0, pixelOffset + 1);
        rawData.writeUInt8(0, pixelOffset + 2);
        rawData.writeUInt8(0, pixelOffset + 3); // Alpha 0
      } else {
        // Emerald background with slight gradient
        const factor = y / height;
        const r = Math.round(16 * (1 - factor) + 4 * factor);
        const g = Math.round(185 * (1 - factor) + 120 * factor);
        const b = Math.round(129 * (1 - factor) + 87 * factor);

        // Center white motif area
        const distToCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (distToCenter < size * 0.28) {
          rawData.writeUInt8(255, pixelOffset);
          rawData.writeUInt8(255, pixelOffset + 1);
          rawData.writeUInt8(255, pixelOffset + 2);
          rawData.writeUInt8(255, pixelOffset + 3);
        } else {
          rawData.writeUInt8(r, pixelOffset);
          rawData.writeUInt8(g, pixelOffset + 1);
          rawData.writeUInt8(b, pixelOffset + 2);
          rawData.writeUInt8(255, pixelOffset + 3);
        }
      }
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", idatCompressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve("public/icons");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "icon-192x192.png"), createEmeraldPng(192));
fs.writeFileSync(path.join(outDir, "icon-512x512.png"), createEmeraldPng(512));
console.log("Successfully generated icon-192x192.png and icon-512x512.png!");
