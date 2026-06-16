#!/usr/bin/env node
/**
 * Generate minimal procedural WAV samples for /public/samples/riddim/.
 * Run: node scripts/generate-riddim-samples.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/samples/riddim");
mkdirSync(outDir, { recursive: true });

const sampleRate = 44100;

function encodeWavPcm16(samples) {
  const numChannels = 1;
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  Buffer.from(pcm.buffer).copy(buffer, 44);
  return buffer;
}

function genKick() {
  const len = Math.floor(sampleRate * 0.25);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const freq = 150 * Math.exp(-t * 18);
    const env = Math.exp(-t * 12);
    out[i] = Math.sin(2 * Math.PI * freq * t) * env;
  }
  return out;
}

function genSnare() {
  const len = Math.floor(sampleRate * 0.18);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
  }
  return out;
}

function genClap() {
  const len = Math.floor(sampleRate * 0.08);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    out[i] = (Math.random() * 2 - 1) * (1 - t) * Math.exp(-t * 18);
  }
  return out;
}

function genHat() {
  const len = Math.floor(sampleRate * 0.04);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  return out;
}

const files = {
  kick: genKick(),
  snare: genSnare(),
  clap: genClap(),
  hat: genHat(),
};

for (const [name, samples] of Object.entries(files)) {
  const path = join(outDir, `${name}.wav`);
  writeFileSync(path, encodeWavPcm16(samples));
  console.log(`wrote ${path}`);
}
