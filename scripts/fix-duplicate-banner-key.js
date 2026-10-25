const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../apps/web-admin/src/lib/initial-categories.ts');
let content = fs.readFileSync(file, 'utf8');

const dupTargetCRLF = '    "actionText": "Telegram Support",\r\n    "actionUrl": "https://t.me/ffrivalstourbdofficial",\r\n';
const dupTargetLF = '    "actionText": "Telegram Support",\n    "actionUrl": "https://t.me/ffrivalstourbdofficial",\n';

if (content.includes(dupTargetCRLF)) {
  content = content.replace(dupTargetCRLF, '');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed CRLF duplicate in initial-categories.ts');
} else if (content.includes(dupTargetLF)) {
  content = content.replace(dupTargetLF, '');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed LF duplicate in initial-categories.ts');
} else {
  console.log('Target not found directly, checking regex');
  const fixed = content.replace(/"actionText":\s*"Telegram Support",\s*"actionUrl":\s*"https:\/\/t\.me\/ffrivalstourbdofficial",\s*/, '');
  if (fixed !== content) {
    fs.writeFileSync(file, fixed, 'utf8');
    console.log('Fixed via regex');
  } else {
    console.error('Failed to match duplicate');
  }
}
