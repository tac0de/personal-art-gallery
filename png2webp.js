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

if (!argv.dir && !inPlace) {
  console.error('필수: --dir=SOURCE_DIR 지정 필요');
  process.exit(1);
}

if (inPlace && argv.out) {
  console.warn('주의: --in-place 모드에서는 --out 옵션이 무시됩니다.');
}

async function collectPNGs(dir, list = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await collectPNGs(full, list);
    } else if (/\.png$/i.test(e.name)) {
      list.push(full);
    }
  }
  return list;
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function processFile(file) {
  try {
    const targetPath = inPlace
      ? file.replace(/\.png$/i, '.webp')
      : path.join(
          outDir,
          path.relative(srcDir, file).replace(/\.png$/i, '.webp')
        );

    if (dryRun) {
      console.log('[dry-run] would convert:', file, '->', targetPath, inPlace ? '(in-place)' : '');
      if (inPlace) {
        console.log('[dry-run] would remove original PNG:', file);
      }
      return;
    }

    // 존재 검사
    if (!force) {
      const exists = await fs
        .access(targetPath)
        .then(() => true)
        .catch(() => false);
      if (exists) {
        console.log('skipped (exists):', targetPath);
        return;
      }
    }

    await ensureDir(targetPath);

    let pipeline = sharp(file);
    if (lossless) {
      pipeline = pipeline.webp({ lossless: true, effort: 6 });
    } else {
      pipeline = pipeline.webp({ quality, effort: 6 });
    }

    await pipeline.toFile(targetPath);
    console.log('converted:', path.relative(srcDir, file), '->', path.relative(inPlace ? path.dirname(file) : outDir, targetPath));

    if (inPlace) {
      // 변환 성공 시 원본 삭제
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

  const pngs = await collectPNGs(srcDir);
  if (pngs.length === 0) {
    console.log('변환할 PNG 파일이 없습니다:', srcDir);
    return;
  }

  // 병렬 처리 제한
  for (let i = 0; i < pngs.length; i += concurrency) {
    const batch = pngs.slice(i, i + concurrency);
    await Promise.all(batch.map(processFile));
  }

  console.log('완료. 총 PNG:', pngs.length);
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
