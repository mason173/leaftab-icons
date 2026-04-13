import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, 'icon-library.json');
const SHAPES_DIR = path.join(ROOT, 'shapes');

const FILE_NAME_WITH_COLOR_PATTERN = /^(.+)_([0-9a-fA-F]{6})\.svg$/i;

const normalizeDomain = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized.endsWith('.svg')) return '';
  const domain = normalized.slice(0, -4);
  if (!domain || !/^[a-z0-9.-]+$/.test(domain) || !domain.includes('.')) return '';
  return domain;
};

const normalizeHexColor = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'white') return '#FFFFFF';
  if (trimmed.toLowerCase() === 'black') return '#000000';

  const matched = trimmed.match(/^#([0-9a-fA-F]{6})$/);
  if (!matched) return '';
  return `#${matched[1].toUpperCase()}`;
};

const sha256Hex = async (filePath) => {
  const buf = await readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
};

const listSvgFiles = async (dirPath) => {
  const files = await readdir(dirPath, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
};

const parseIconFileName = (fileName) => {
  const normalized = String(fileName || '').trim();
  const matched = normalized.match(FILE_NAME_WITH_COLOR_PATTERN);
  if (matched) {
    const domain = normalizeDomain(`${matched[1]}.svg`);
    const defaultColor = normalizeHexColor(`#${matched[2]}`);
    if (!domain || !defaultColor) return null;
    return {
      domain,
      defaultColor,
    };
  }
};

const buildLibrary = async ({ shapeDir }) => {
  const shapeFiles = await listSvgFiles(shapeDir);
  if (!shapeFiles.length) {
    throw new Error(`[icons] no SVG files found in ${path.relative(ROOT, shapeDir)}`);
  }

  const icons = {};
  for (const fileName of shapeFiles) {
    const parsed = parseIconFileName(fileName);
    if (!parsed?.domain) {
      throw new Error(`[icons] invalid SVG file name: ${fileName}`);
    }
    const { domain } = parsed;
    if (icons[domain]) {
      throw new Error(`[icons] duplicate icon domain detected: ${domain}`);
    }

    const filePath = path.join(shapeDir, fileName);
    const fileStat = await stat(filePath);
    icons[domain] = {
      mode: 'shape-color',
      shapePath: `shapes/${fileName}`,
      defaultColor: parsed.defaultColor,
      sha256: await sha256Hex(filePath),
      updatedAt: fileStat.mtime.toISOString(),
    };
  }

  const now = new Date();
  const library = {
    version: now.toISOString().split('T')[0],
    generatedAt: now.toISOString(),
    icons,
  };

  await writeFile(SOURCE_FILE, `${JSON.stringify(library, null, 2)}\n`, 'utf8');
  console.log(`[icons] wrote icon-library.json with ${shapeFiles.length} icons`);
};

const main = async () => {
  await buildLibrary({ shapeDir: SHAPES_DIR });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
