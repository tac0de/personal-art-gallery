#!/usr/bin/env node
/**
 * Usage examples:
 *  # 변환해서 별도 출력 폴더에 저장
 *  node png2webp.js --dir=./assets --out=./webp_out --quality=75
 *
 *  # 무손실 변환, 원본 png를 .webp로 교체 (in-place)
 *  node png2webp.js --dir=./assets --in-place --lossless
 *
 *  # 덮어쓰기 허용, 동시 처리 8개, dry-run (실제 변환 없이 로그만)
 *  node png2webp.js --dir=./assets --in-place --force --concurrency=8 --dry-run
 *
 *  # 번호 매기기와 함께 변환 (1.webp, 2.webp, ...)
 *  node png2webp.js --dir=./assets --out=./webp_out --number
 *
 *  # 번호 매기기와 함께 in-place 변환
 *  node png2webp.js --dir=./assets --in-place --number
 *
 *  # 번호 매기기 시작 번호 지정
 *  node png2webp.js --dir=./assets --out=./webp_out --number --start=10
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

function parseArgs() {
  return process.argv.slice(2).reduce((acc, raw) => {
    if (!raw.startsWith('--')) return acc;
    const [k, v] = raw.slice(2).split('=');
    if (v === undefined) {
      acc[k] = true;
    } else if (v === 'false') {
      acc[k] = false;
    } else if (v === 'true') {
      acc[k] = true;
    } else {
      acc[k] = v;
    }
    return acc;
  }, {});
}

const argv = parseArgs();
const srcDir = argv.dir || argv._ || 'src'; // fallback if someone passes positional (not recommended)
const outDir = argv.out || 'out';
const quality = parseInt(argv.quality ?? '80', 10);
const lossless = !!argv.lossless;
const inPlace = !!argv['in-place'];
const dryRun = !!argv['dry-run'];
const force = !!argv.force;
const concurrency = Math.max(1, parseInt(argv.concurrency ?? '4', 10));
const numberFiles = !!argv.number;
const startNumber = parseInt(argv.start ?? '1', 10);

if (!argv.dir && !inPlace) {
  console.error('필수: --dir=SOURCE_DIR 지정 필요');
  process.exit(1);
}

if (inPlace && argv.out) {
  console.warn('주의: --in-place 모드에서는 --out 옵션이 무시됩니다.');
}

async function collectImages(dir, list = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await collectImages(full, list);
    } else if (/\.(png|webp)$/i.test(e.name)) {
      list.push(full);
    }
  }
  return list;
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function processFile(file, index) {
  try {
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    let targetPath;

    if (numberFiles) {
      const number = startNumber + index;
      const fileName = `${number}.webp`;
      targetPath = inPlace ? path.join(path.dirname(file), fileName) : path.join(outDir, fileName);
    } else {
      targetPath = inPlace
        ? file.replace(/\.(png|webp)$/i, '.webp')
        : path.join(outDir, path.relative(srcDir, file).replace(/\.(png|webp)$/i, '.webp'));
    }

    if (dryRun) {
      console.log('[dry-run] would process:', file, '->', targetPath, inPlace ? '(in-place)' : '');
      return;
    }

    await ensureDir(targetPath);

    if (ext === '.png') {
      // Convert PNG to WebP
      let pipeline = sharp(file);
      if (lossless) {
        pipeline = pipeline.webp({ lossless: true, effort: 6 });
      } else {
        pipeline = pipeline.webp({ quality, effort: 6 });
      }
      await pipeline.toFile(targetPath);
      console.log('converted:', path.relative(srcDir, file), '->', path.relative(inPlace ? path.dirname(file) : outDir, targetPath));
    } else if (ext === '.webp') {
      // Rename or copy existing WebP
      if (file !== targetPath) {
        await fs.copyFile(file, targetPath);
        console.log('processed:', path.relative(srcDir, file), '->', path.relative(inPlace ? path.dirname(file) : outDir, targetPath));
        if (inPlace) {
          await fs.unlink(file);
        }
      } else {
        console.log('skipped (already in place):', path.relative(srcDir, file));
      }
    }

    if (inPlace && ext === '.png') {
      // Remove original PNG after conversion
      await fs.unlink(file);
      console.log('removed original png:', path.relative(srcDir, file));
    }
  } catch (err) {
    console.error('error processing', file, err.message);
  }
}

async function main() {
  if (!existsSync(srcDir)) {
    console.error('소스 디렉토리 없음:', srcDir);
    process.exit(1);
  }

  const images = await collectImages(srcDir);
  if (images.length === 0) {
    console.log('처리할 이미지 파일이 없습니다:', srcDir);
    return;
  }

  // Sort images to ensure consistent order
  images.sort();

  // Process files in batches
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    await Promise.all(batch.map((file, batchIndex) => processFile(file, i + batchIndex)));
  }

  console.log('완료. 총 이미지:', images.length);
  if (numberFiles) {
    console.log(`번호 매기기: ${startNumber}부터 ${startNumber + images.length - 1}까지`);
  }
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
