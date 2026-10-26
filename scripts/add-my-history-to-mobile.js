const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web-admin/src/app/mobile-app-view/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add History icon import
if (!content.includes('History,')) {
  content = content.replace('ShieldCheck,', 'ShieldCheck,\n  History,');
  console.log('Added History icon import');
}

// 2. Add MyHistoryComponent import
if (!content.includes("import MyHistoryComponent from '@/components/MyHistoryComponent';")) {
  content = content.replace(
    "import SupportChatScreen from '@/components/SupportChatScreen';",
    "import SupportChatScreen from '@/components/SupportChatScreen';\nimport MyHistoryComponent from '@/components/MyHistoryComponent';"
  );
  console.log('Added MyHistoryComponent import');
}

// 3. Add showMyHistory and historyInitialTab state
if (!content.includes('const [showMyHistory, setShowMyHistory]')) {
  content = content.replace(
    'const [showRulesModal, setShowRulesModal] = useState(false);',
    'const [showRulesModal, setShowRulesModal] = useState(false);\n  const [showMyHistory, setShowMyHistory] = useState(false);\n  const [historyInitialTab, setHistoryInitialTab] = useState<"ADD_MONEY" | "MATCH_ENTRY" | "WITHDRAW" | "MATCH_WINNINGS">("ADD_MONEY");'
  );
  console.log('Added showMyHistory state');
}

// 4. In Profile tab: add My History menu item before Rules
const rulesItemTarget = `{/* 1. Rules */}
                            <div
                              onClick={() => setShowRulesModal(true)}`;

const myHistoryMenuItem = `{/* 0. My History (User Requested) */}
                            <div
                              onClick={() => {
                                setHistoryInitialTab('ADD_MONEY');
                                setShowMyHistory(true);
                              }}
                              className="bg-white rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-3 flex items-center justify-between shadow-xs hover:border-amber-400 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fef9c3] text-[#ca8a04] flex items-center justify-center border border-amber-200 shadow-2xs">
                                  <History className="w-5 h-5 text-[#ca8a04]" />
                                </div>
                                <div>
                                  <span className="font-black text-slate-900 text-sm block">{tPhone('মাই হিস্ট্রি', 'My History')}</span>
                                  <span className="text-[10px] text-slate-500 font-bold block">{tPhone('অ্যাড মানি, ম্যাচ এন্ট্রি ও উইথড্র হিস্ট্রি', 'Add Money, Entry & Withdraw')}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-amber-500" />
                            </div>

                            {/* 1. Rules */}
                            <div
                              onClick={() => setShowRulesModal(true)}`;

if (content.includes(rulesItemTarget)) {
  content = content.replace(rulesItemTarget, myHistoryMenuItem);
  console.log('Added My History to Profile menu items');
} else {
  console.log('Could not find rulesItemTarget directly, checking fallback');
}

// 5. In Wallet tab: Update Deposit & Withdraw buttons to navigate to dedicated fresh pages
const walletButtonsTarget = `{/* Direct Withdraw & Deposit Buttons inside Wallet */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              setFinanceModalTab('WITHDRAW');
                              setShowFinanceModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            <span>{tPhone('উইথড্র (টাকা তোলা)', 'Withdraw Money')}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              setFinanceModalTab('DEPOSIT');
                              setShowFinanceModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-white/30 active:scale-95 transition-all"
                          >
                            <ArrowDownRight className="w-4 h-4 text-amber-400" />
                            <span>{tPhone('ডিপোজিট (টাকা যোগ)', 'Add Money')}</span>
                          </button>
                        </div>`;

const walletButtonsReplacement = `{/* Direct Withdraw & Deposit Buttons inside Wallet - Navigates to dedicated fresh pages */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              window.location.href = '/withdraw';
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            <span>{tPhone('উইথড্র (টাকা তোলা)', 'Withdraw Money')}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              window.location.href = '/deposit';
                            }}
                            className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-white/30 active:scale-95 transition-all"
                          >
                            <ArrowDownRight className="w-4 h-4 text-amber-400" />
                            <span>{tPhone('ডিপোজিট (টাকা যোগ)', 'Add Money')}</span>
                          </button>
                        </div>

                        {/* View My History Button inside Wallet */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryInitialTab('ADD_MONEY');
                              setShowMyHistory(true);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[11px] flex items-center justify-center gap-1.5 border border-white/20 active:scale-95 transition-all"
                          >
                            <History className="w-3.5 h-3.5 text-amber-300" />
                            <span>{tPhone('📜 লেনদেন ও ম্যাচ হিস্ট্রি দেখুন (My History)', '📜 View My History')}</span>
                          </button>
                        </div>`;

if (content.includes(walletButtonsTarget)) {
  content = content.replace(walletButtonsTarget, walletButtonsReplacement);
  console.log('Updated Wallet tab buttons to navigate to fresh /deposit and /withdraw pages + My History');
} else {
  console.log('walletButtonsTarget not matched directly');
}

// 6. Render MyHistoryComponent overlay
const myHistoryOverlay = `
      {/* 9.9. MY HISTORY FULL-SCREEN VIEW (USER REQUESTED) */}
      {showMyHistory && (
        <div className="fixed inset-0 z-50 bg-[#faf5ff] overflow-y-auto no-scrollbar animate-fadeIn">
          <MyHistoryComponent
            initialTab={historyInitialTab}
            onBack={() => setShowMyHistory(false)}
          />
        </div>
      )}
`;

if (!content.includes('MY HISTORY FULL-SCREEN VIEW')) {
  content = content.replace('{/* 9. RULES MODAL */}', myHistoryOverlay + '\n      {/* 9. RULES MODAL */}');
  console.log('Added MyHistory full screen overlay to mobile-app-view/page.tsx');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved mobile-app-view/page.tsx');
