const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web-admin/src/app/(player)/wallet/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Import Link and History
if (!content.includes("import Link from 'next/link';")) {
  content = "import Link from 'next/link';\n" + content;
}
if (!content.includes('History,')) {
  content = content.replace('Loader2', 'Loader2, History');
}

// Add My History Link next to Header
const targetHeader = `<h1 className="text-3xl font-extrabold text-white">bKash & Nagad Wallet</h1>`;
const replacementHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">bKash & Nagad Wallet</h1>
            <p className="text-sm text-gray-400 mt-1">
              Deposit funds to join matches or withdraw your verified tournament earnings.
            </p>
          </div>
          <Link
            href="/history"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <History className="w-4 h-4" />
            <span>📜 মাই হিস্ট্রি (My History)</span>
          </Link>
        </div>`;

if (content.includes(targetHeader)) {
  content = content.replace(/<div>\s*<h1 className="text-3xl font-extrabold text-white">bKash & Nagad Wallet<\/h1>\s*<p className="text-sm text-gray-400 mt-1">[\s\S]*?<\/p>\s*<\/div>/, replacementHeader);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated wallet page header with My History Link');
}
