import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else {
      const ext = path.extname(file);
      if (exts.includes(ext)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const allTsFiles = getAllFiles(srcDir);

// 1. Files with > 10 useState calls
const useStateStats = [];
for (const file of allTsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/useState\s*(?:<[^>]+>)?\s*\(/g);
  const count = matches ? matches.length : 0;
  if (count > 8) {
    useStateStats.push({ file: path.relative(srcDir, file), count });
  }
}
useStateStats.sort((a, b) => b.count - a.count);

// 2. Date formatting calls
let rawDateCalls = 0;
const dateCallFiles = [];
for (const file of allTsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/\.toLocale(?:Date|Time)String\(/g);
  if (matches) {
    rawDateCalls += matches.length;
    dateCallFiles.push({ file: path.relative(srcDir, file), count: matches.length });
  }
}

// 3. Inline type/interface in pages
const inlineTypes = [];
const pageFiles = allTsFiles.filter(f => f.includes(`${path.sep}pages${path.sep}`));
for (const file of pageFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/.test(line.trim())) {
      // allow Props type or internal simple alias
      const m = line.trim().match(/^(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/);
      if (m && !m[1].endsWith('Props')) {
        inlineTypes.push({ file: path.relative(srcDir, file), type: m[1], line: i + 1 });
      }
    }
  }
}

// 4. Dead / legacy api files
const legacyApiDir = path.join(srcDir, 'api');
let legacyApiFiles = [];
if (fs.existsSync(legacyApiDir)) {
  legacyApiFiles = getAllFiles(legacyApiDir);
}

console.log('=== SENIOR AUDIT REPORT (ROUND 3) ===\n');
console.log(`1. Files with > 8 useState calls (${useStateStats.length} files):`);
useStateStats.forEach(s => console.log(`   - ${s.file}: ${s.count} useStates`));

console.log(`\n2. Raw toLocaleDate/TimeString calls: ${rawDateCalls}`);
dateCallFiles.forEach(s => console.log(`   - ${s.file}: ${s.count}`));

console.log(`\n3. Inline types in pages (${inlineTypes.length} found):`);
inlineTypes.forEach(t => console.log(`   - ${t.file}:${t.line} (${t.type})`));

console.log(`\n4. Files in src/api/: ${legacyApiFiles.length}`);
legacyApiFiles.forEach(f => console.log(`   - ${path.relative(srcDir, f)}`));
