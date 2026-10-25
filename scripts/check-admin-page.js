const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'apps/web-admin/src/app/(dashboard)/admin/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('File size:', content.length);
console.log('Has getUsers:', content.includes('getUsers'));
console.log('Has isMatchFinished:', content.includes('isMatchFinished'));
