const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web-admin/src/app/profile/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add History icon import
if (!content.includes('History,')) {
  content = content.replace('Smartphone,', 'Smartphone,\n  History,');
}

// 2. Add My History button alongside Deposit and Withdraw
const targetBtn = `<button
              onClick={() => {
                setFinanceModalTab('DEPOSIT');
                setShowFinanceModal(true);
              }}
              className="px-3 py-1.5 rounded-lg btn-red text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> ডিপোজিট (Deposit)
            </button>`;

const replacementBtn = `<Link
              href="/deposit"
              className="px-3 py-1.5 rounded-lg btn-red text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> ডিপোজিট (Deposit)
            </Link>
            <Link
              href="/withdraw"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" /> উইথড্র (Withdraw)
            </Link>
            <Link
              href="/history"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black flex items-center gap-1 shadow-sm"
            >
              <History className="w-3.5 h-3.5" /> মাই হিস্ট্রি (My History)
            </Link>`;

if (content.includes(targetBtn)) {
  // Also remove the old withdraw button that follows it
  const oldWithdraw = `<button
              onClick={() => {
                setFinanceModalTab('WITHDRAW');
                setShowFinanceModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" /> উইথড্র (Withdraw)
            </button>`;
  content = content.replace(targetBtn, replacementBtn);
  content = content.replace(oldWithdraw, '');
  console.log('Updated profile balance buttons to Link to /deposit, /withdraw, and /history');
}

// 3. Add My History Card right before Recent Tournaments History
const historyCard = `
      {/* My History Entry Card (User Requested) */}
      <Link
        href="/history"
        className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm hover:border-amber-500/60 transition-all flex items-center justify-between gap-4 block"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              📜 মাই হিস্ট্রি (My History)
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                NEW
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              অ্যাড মানি, ম্যাচ এন্ট্রি ফি, উইথড্র ট্রানজেকশন এবং ম্যাচ উইনিং হিস্ট্রি একনজরে দেখুন।
            </p>
          </div>
        </div>

        <span className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm hover:bg-amber-400 whitespace-nowrap">
          হিস্ট্রি খুলুন →
        </span>
      </Link>
`;

if (!content.includes('মাই হিস্ট্রি (My History)')) {
  content = content.replace('{/* Recent Tournaments History */}', historyCard + '\n      {/* Recent Tournaments History */}');
  console.log('Added My History Card to profile/page.tsx');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved profile/page.tsx');
