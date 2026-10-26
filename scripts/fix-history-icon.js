const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web-admin/src/app/mobile-app-view/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace `  ShieldCheck,` with `  ShieldCheck,\n  History as HistoryIcon,`
content = content.replace('  ShieldCheck,\n', '  ShieldCheck,\n  History as HistoryIcon,\n');
content = content.replace('  ShieldCheck,\r\n', '  ShieldCheck,\r\n  History as HistoryIcon,\r\n');

// Replace `<History ` with `<HistoryIcon `
content = content.replace(/<History className/g, '<HistoryIcon className');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully imported History as HistoryIcon in mobile-app-view/page.tsx');
