import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 48;
const H = 48;

const bg = { r: 0x25, g: 0x63, b: 0xeb, a: 0xff }; // #2563EB
const fg = { r: 0xff, g: 0xff, b: 0xff, a: 0xff };

function insideRoundedRect(x, y, rx = 10) {
  // Rect: (2,2) -> (46,46) with radius rx.
  // Pixel center test.
  const px = x + 0.5;
  const py = y + 0.5;
  const left = 2;
  const top = 2;
  const right = 46;
  const bottom = 46;

  // Fast include.
  if (px < left || px > right || py < top || py > bottom) return false;

  // Corner circles.
  const tl = { cx: left + rx, cy: top + rx };
  const tr = { cx: right - rx, cy: top + rx };
  const bl = { cx: left + rx, cy: bottom - rx };
  const br = { cx: right - rx, cy: bottom - rx };

  // If within the corner square areas, enforce circle radius.
  if (px < left + rx && py < top + rx) {
    const dx = px - tl.cx;
    const dy = py - tl.cy;
    return dx * dx + dy * dy <= rx * rx;
  }
  if (px > right - rx && py < top + rx) {
    const dx = px - tr.cx;
    const dy = py - tr.cy;
    return dx * dx + dy * dy <= rx * rx;
  }
  if (px < left + rx && py > bottom - rx) {
    const dx = px - bl.cx;
    const dy = py - bl.cy;
    return dx * dx + dy * dy <= rx * rx;
  }
  if (px > right - rx && py > bottom - rx) {
    const dx = px - br.cx;
    const dy = py - br.cy;
    return dx * dx + dy * dy <= rx * rx;
  }

  return true;
}

// 5x7 pixel font for 'R'
const R = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 1, 0, 0],
  [1, 0, 0, 1, 0],
  [1, 0, 0, 0, 1],
];

const scale = 4;
const startX1 = 2;
const startY = 10;
const gap = 4;
const startX2 = startX1 + 5 * scale + gap;

function makeCanvas() {
  const pixels = new Uint8Array(W * H * 4);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      if (!insideRoundedRect(x, y, 10)) {
        pixels[idx + 0] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }
      pixels[idx + 0] = bg.r;
      pixels[idx + 1] = bg.g;
      pixels[idx + 2] = bg.b;
      pixels[idx + 3] = bg.a;
    }
  }

  function drawR(originX) {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (!R[row][col]) continue;
        for (let yy = 0; yy < scale; yy++) {
          for (let xx = 0; xx < scale; xx++) {
            const x = originX + col * scale + xx;
            const y = startY + row * scale + yy;
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            const idx = (y * W + x) * 4;
            if (pixels[idx + 3] === 0) continue; // keep corners transparent
            pixels[idx + 0] = fg.r;
            pixels[idx + 1] = fg.g;
            pixels[idx + 2] = fg.b;
            pixels[idx + 3] = fg.a;
          }
        }
      }
    }
  }

  drawR(startX1);
  drawR(startX2);

  return pixels;
}

function buildIco(pixels) {
  // ICO with one 48x48 32bpp image stored as DIB (BMP) data.
  const andRowBytes = Math.ceil(W / 32) * 4; // aligned to 32 bits
  const andMaskSize = andRowBytes * H;
  const xorSize = W * H * 4;
  const dibHeaderSize = 40;
  const imageDataSize = dibHeaderSize + xorSize + andMaskSize;

  const iconDirSize = 6;
  const entrySize = 16;
  const imageOffset = iconDirSize + entrySize;

  const buf = Buffer.alloc(imageOffset + imageDataSize);
  let off = 0;

  // ICONDIR
  buf.writeUInt16LE(0, off); // reserved
  off += 2;
  buf.writeUInt16LE(1, off); // type = icon
  off += 2;
  buf.writeUInt16LE(1, off); // count
  off += 2;

  // ICONDIRENTRY
  buf.writeUInt8(W === 256 ? 0 : W, off++);
  buf.writeUInt8(H === 256 ? 0 : H, off++);
  buf.writeUInt8(0, off++); // colorCount
  buf.writeUInt8(0, off++); // reserved
  buf.writeUInt16LE(1, off); // planes
  off += 2;
  buf.writeUInt16LE(32, off); // bitCount
  off += 2;
  buf.writeUInt32LE(imageDataSize, off);
  off += 4;
  buf.writeUInt32LE(imageOffset, off);
  off += 4;

  // BITMAPINFOHEADER
  buf.writeUInt32LE(dibHeaderSize, off);
  off += 4;
  buf.writeInt32LE(W, off);
  off += 4;
  buf.writeInt32LE(H * 2, off); // includes AND mask
  off += 4;
  buf.writeUInt16LE(1, off); // planes
  off += 2;
  buf.writeUInt16LE(32, off); // bitCount
  off += 2;
  buf.writeUInt32LE(0, off); // compression BI_RGB
  off += 4;
  buf.writeUInt32LE(xorSize + andMaskSize, off);
  off += 4;
  buf.writeInt32LE(0, off); // xPelsPerMeter
  off += 4;
  buf.writeInt32LE(0, off); // yPelsPerMeter
  off += 4;
  buf.writeUInt32LE(0, off); // clrUsed
  off += 4;
  buf.writeUInt32LE(0, off); // clrImportant
  off += 4;

  // XOR bitmap: BGRA, bottom-up
  for (let y = H - 1; y >= 0; y--) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = pixels[idx + 0];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      buf[off++] = b;
      buf[off++] = g;
      buf[off++] = r;
      buf[off++] = a;
    }
  }

  // AND mask: 1 bit per pixel, padded rows, bottom-up; 1 = transparent
  for (let y = H - 1; y >= 0; y--) {
    let bit = 7;
    let currentByte = 0;
    let rowBytesWritten = 0;

    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const transparent = pixels[idx + 3] === 0;
      if (transparent) currentByte |= 1 << bit;
      bit--;
      if (bit < 0) {
        buf[off++] = currentByte;
        rowBytesWritten++;
        bit = 7;
        currentByte = 0;
      }
    }

    if (bit !== 7) {
      buf[off++] = currentByte;
      rowBytesWritten++;
    }

    while (rowBytesWritten < andRowBytes) {
      buf[off++] = 0;
      rowBytesWritten++;
    }
  }

  return buf;
}

const pixels = makeCanvas();
const ico = buildIco(pixels);
const outPath = resolve(process.cwd(), 'app', 'favicon.ico');
writeFileSync(outPath, ico);
console.log(`Wrote ${outPath} (${ico.length} bytes)`);
