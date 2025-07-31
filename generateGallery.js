#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const ASSET_DIR = path.join(ROOT, 'assets');
const OUT_FILE = path.join(ROOT, 'gallery.json');

async function existsDir(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const list = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list.push(...(await walk(full)));
    } else if (/\.webp$/i.test(entry.name)) {
      const rel = path.relative(ROOT, full).replaceAll(path.sep, '/');
      list.push('/' + rel);
    }
  }
  return list;
}

async function main() {
  console.log('>> gallery.json 생성 시작');
  if (!(await existsDir(ASSET_DIR))) {
    console.error('에러: asset 폴더가 없습니다:', ASSET_DIR);
    process.exit(1);
  }

  const images = await walk(ASSET_DIR);
  if (images.length === 0) {
    console.warn('경고: webp 파일을 찾지 못했습니다:', ASSET_DIR);
  }
  images.sort();
  const gallery = images.map((url, i) => ({ id: i + 1, image: url }));
  await fs.writeFile(OUT_FILE, JSON.stringify(gallery, null, 2));
  console.log(`완료: gallery.json 생성됨 (${gallery.length}개) -> ${OUT_FILE}`);
}

main().catch((e) => {
  console.error('예기치 않은 오류:', e);
  process.exit(1);
});
