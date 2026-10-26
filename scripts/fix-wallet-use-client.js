const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web-admin/src/app/(player)/wallet/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure 'use client'; is the very first line
content = content.replace("import Link from 'next/link';\n'use client';", "'use client';\n\nimport Link from 'next/link';");
content = content.replace("'use client';\n'use client';", "'use client';");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed use client directive position');
