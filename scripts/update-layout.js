const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '..', 'apps/web-admin/src/app/(dashboard)/admin/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
if (!layoutContent.includes('Match Players Audit')) {
  layoutContent = layoutContent.replace(
    "{ label: '🎮 Match Management', href: '/admin/tournaments', icon: Trophy },",
    "{ label: '🎮 Match Management', href: '/admin/tournaments', icon: Trophy },\r\n    { label: '📋 Match Players Audit', href: '/admin#match-participants-section', icon: Users },"
  );
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
  console.log('Updated layout.tsx successfully!');
} else {
  console.log('layout.tsx already has Match Players Audit');
}
