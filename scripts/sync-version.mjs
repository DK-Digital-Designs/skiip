import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const version = readFileSync(join(rootDir, 'VERSION'), 'utf8').trim();

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`VERSION must be SemVer major.minor.patch, received "${version}"`);
}

function writeJson(path, updater) {
  const filePath = join(rootDir, path);
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  updater(json);
  writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

writeJson('app/package.json', (json) => {
  json.version = version;
});

writeJson('app/package-lock.json', (json) => {
  json.version = version;
  if (json.packages?.['']) {
    json.packages[''].version = version;
  }
});

writeFileSync(
  join(rootDir, 'app/src/lib/version.js'),
  `export const APP_VERSION = '${version}';\nexport const APP_VERSION_LABEL = \`Version v\${APP_VERSION}\`;\n`,
);

writeFileSync(
  join(rootDir, 'site/assets/js/version.js'),
  `export const SITE_VERSION = '${version}';\nexport const SITE_VERSION_LABEL = \`Version v\${SITE_VERSION}\`;\n\ndocument.querySelectorAll('[data-app-version]').forEach((element) => {\n  element.textContent = SITE_VERSION_LABEL;\n});\n`,
);

for (const fileName of readdirSync(join(rootDir, 'site'))) {
  if (!fileName.endsWith('.html')) continue;

  const filePath = join(rootDir, 'site', fileName);
  const source = readFileSync(filePath, 'utf8');
  const next = source.replace(
    /(<[^>]+data-app-version[^>]*>)Version v\d+\.\d+\.\d+(<\/[^>]+>)/g,
    `$1Version v${version}$2`,
  );

  if (next !== source) {
    writeFileSync(filePath, next);
  }
}

console.log(`Synced SKIIP version ${version}`);
