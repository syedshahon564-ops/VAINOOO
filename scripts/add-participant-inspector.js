const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'apps/web-admin/src/app/(dashboard)/admin/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add imports if not present
if (!content.includes("import { getUsers")) {
  content = content.replace(
    "import { useCMS, MatchItem, BannerSlide, INITIAL_CATEGORIES } from '@/lib/cms-store';",
    "import { useCMS, MatchItem, BannerSlide, INITIAL_CATEGORIES } from '@/lib/cms-store';\r\nimport { getUsers, UserAccount } from '@/lib/user-store';\r\nimport { getUserBookedMatches, getUserPlayedMatchesHistory } from '@/lib/match-scheduler';\r\nimport { isMatchFinished } from '@/components/LiveMatchCountdown';"
  );
}

// 2. Add State and Helper functions inside AdminMasterPage
const stateHookTarget = "const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(getSchedulerConfig());";
const stateAndHelpers = `const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(getSchedulerConfig());

  // ==============================================================
  // MATCH PARTICIPANTS & USERNAME INSPECTOR STATE (OWNER AUDIT)
  // ==============================================================
  const [selectedParticipantMatchId, setSelectedParticipantMatchId] = useState<string | null>(null);
  const [participantMatchFilter, setParticipantMatchFilter] = useState<'COMPLETED' | 'ALL' | 'LIVE'>('COMPLETED');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [copiedUidStatus, setCopiedUidStatus] = useState<string | null>(null);

  // Helper to compile full participants list with App Username, UID, IGN, Phone & Results
  const getJoinedPlayersForMatch = (match: MatchItem) => {
    const users = getUsers();
    const bookedMatches = getUserBookedMatches();
    const playedHistory = getUserPlayedMatchesHistory();

    const relatedBookings = [...bookedMatches, ...playedHistory].filter(
      (b) => b && (b.matchId === match.id || (match.title && b.title === match.title))
    );

    const embedded = match.participants || [];
    const seen = new Set<string>();
    const list: Array<{
      slot: number;
      ign: string;
      uid: string;
      username: string;
      phone: string;
      team?: number;
      isFirstPlayer: boolean;
      rank?: number;
      kills?: number;
      prize?: number;
    }> = [];

    embedded.forEach((p, idx) => {
      const pIgn = p.ign || 'Player';
      const key = \`\${p.slot || idx + 1}-\${pIgn.toLowerCase().trim()}-\${p.uid || ''}\`;
      if (!seen.has(key)) {
        seen.add(key);

        const matchedUser = users.find(
          (u) =>
            (p.userId && u.id === p.userId) ||
            (p.uid && u.uid && u.uid === p.uid) ||
            (u.ign && u.ign.toLowerCase().trim() === pIgn.toLowerCase().trim()) ||
            (p.userPhone && u.phone === p.userPhone)
        );

        const username = p.username || matchedUser?.username || matchedUser?.phone || pIgn;
        const phone = p.userPhone || matchedUser?.phone || 'N/A';
        const uid = p.uid || matchedUser?.uid || '---';

        const resultEntry = match.results?.find(
          (r) => r.ign.toLowerCase().trim() === pIgn.toLowerCase().trim()
        );

        list.push({
          slot: p.slot || idx + 1,
          ign: pIgn,
          uid,
          username,
          phone,
          team: p.team || 1,
          isFirstPlayer: idx === 0 || p.slot === 1,
          rank: resultEntry?.rank,
          kills: resultEntry?.kills,
          prize: resultEntry?.prize,
        });
      }
    });

    relatedBookings.forEach((b) => {
      const bIgn = b.ign || 'Player';
      const key = \`\${b.slot}-\${bIgn.toLowerCase().trim()}-\${b.uid || ''}\`;
      if (!seen.has(key)) {
        seen.add(key);
        const matchedUser = users.find(
          (u) =>
            (b.userId && u.id === b.userId) ||
            (b.uid && u.uid && u.uid === b.uid) ||
            (u.ign && u.ign.toLowerCase().trim() === bIgn.toLowerCase().trim()) ||
            (b.userPhone && u.phone === b.userPhone)
        );

        const username = b.username || matchedUser?.username || matchedUser?.phone || bIgn;
        const phone = b.userPhone || matchedUser?.phone || 'N/A';

        const resultEntry = match.results?.find(
          (r) => r.ign.toLowerCase().trim() === bIgn.toLowerCase().trim()
        );

        list.push({
          slot: b.slot,
          ign: bIgn,
          uid: b.uid || '---',
          username,
          phone,
          team: b.team || 1,
          isFirstPlayer: b.slot === 1,
          rank: resultEntry?.rank,
          kills: resultEntry?.kills,
          prize: resultEntry?.prize,
        });
      }
    });

    // Ensure First Player (slot 1 or first registered) is at the very top
    return list.sort((a, b) => a.slot - b.slot);
  };`;

if (!content.includes("MATCH PARTICIPANTS & USERNAME INSPECTOR STATE")) {
  content = content.replace(stateHookTarget, stateAndHelpers);
}

// 3. Add the UI Section at the very bottom right before the Room Pass modal
const modalTarget = "{/* ============================================================== */}\r\n      {/* ROOM PASS INJECT MODAL";
const altModalTarget = "{/* ============================================================== */}\n      {/* ROOM PASS INJECT MODAL";

const participantsSectionUI = `
      {/* ============================================================== */}
      {/* OWNER EXCLUSIVE: MATCH JOINED PLAYERS & USERNAME INSPECTOR     */}
      {/* ============================================================== */}
      <div id="match-participants-section" className="mt-12 pt-8 border-t-2 border-dashed border-gray-200 dark:border-white/10 space-y-6">
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    👥 ম্যাচ পার্টিসিপেন্ট ও প্লেয়ার অডিট (Match Joined Players & Usernames)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    👑 Owner & Admin Exclusive
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  কোন ম্যাচে কে কে জয়েন করেছে তার পূর্ণাঙ্গ তালিকা: অ্যাপ ইউজারনেম (Username), ফ্রি ফায়ার UID, ইন-গেম নাম (IGN) ও স্লট পজিশন।
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setParticipantMatchFilter('COMPLETED')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  participantMatchFilter === 'COMPLETED'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }\`}
              >
                🏁 সমাপ্ত ম্যাচসমূহ (Finished)
              </button>
              <button
                type="button"
                onClick={() => setParticipantMatchFilter('ALL')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  participantMatchFilter === 'ALL'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }\`}
              >
                🎮 সকল ম্যাচ (All)
              </button>
              <button
                type="button"
                onClick={() => setParticipantMatchFilter('LIVE')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  participantMatchFilter === 'LIVE'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }\`}
              >
                ⚡ রানিং ও আসন্ন (Live/Upcoming)
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="ম্যাচের নাম, প্লেয়ারের ইউজারনেম, UID বা ইন-গেম নাম (IGN) দিয়ে সার্চ করুন..."
              value={participantSearchQuery}
              onChange={(e) => setParticipantSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-semibold focus:outline-none focus:border-red-500 pr-10"
            />
          </div>

          {/* Matches List Grid */}
          {(() => {
            const query = participantSearchQuery.toLowerCase().trim();

            const filteredMatches = matches.filter((m) => {
              const isFinished = m.status === 'COMPLETED' || isMatchFinished(m) || (m.results && m.results.length > 0);
              if (participantMatchFilter === 'COMPLETED' && !isFinished) return false;
              if (participantMatchFilter === 'LIVE' && isFinished) return false;

              if (!query) return true;

              // Check match title
              if (m.title?.toLowerCase().includes(query)) return true;
              if (m.categorySlug?.toLowerCase().includes(query)) return true;

              // Check participants inside match
              const players = getJoinedPlayersForMatch(m);
              return players.some(
                (p) =>
                  p.username.toLowerCase().includes(query) ||
                  p.ign.toLowerCase().includes(query) ||
                  p.uid.toLowerCase().includes(query) ||
                  p.phone.includes(query)
              );
            });

            if (filteredMatches.length === 0) {
              return (
                <div className="py-12 text-center rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 space-y-2">
                  <Trophy className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-500">
                    কোনো ম্যাচ পাওয়া যায়নি। (ফিল্টার পরিবর্তন করে দেখতে পারেন)
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((m) => {
                  const players = getJoinedPlayersForMatch(m);
                  const isFinished = m.status === 'COMPLETED' || isMatchFinished(m) || (m.results && m.results.length > 0);
                  const firstPlayer = players[0];

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedParticipantMatchId(m.id)}
                      className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/20 hover:border-red-500 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 border border-red-500/20">
                            {categories[m.categorySlug]?.name || m.categorySlug}
                          </span>
                          <span className={\`text-[10px] font-black px-2 py-0.5 rounded-full \${
                            isFinished
                              ? 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-pulse'
                          }\`}>
                            {isFinished ? '🏁 FINISHED' : '🟢 ACTIVE / OPEN'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-1">
                            {m.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-amber-500" /> {m.time}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Map: {m.map}
                            </span>
                          </div>
                        </div>

                        {/* First player preview badge */}
                        {firstPlayer && (
                          <div className="p-2 rounded-xl bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black">
                                #1 FIRST
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white truncate">
                                {firstPlayer.username} ({firstPlayer.ign})
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-gray-500 flex-shrink-0">
                              UID: {firstPlayer.uid}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {players.length} জন প্লেয়ার জয়েন করেছে
                        </span>
                        <span className="text-[11px] font-black text-red-600 hover:underline">
                          লিস্ট দেখুন &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DETAILED MATCH PARTICIPANTS MODAL (OWNER INSPECTION)           */}
      {/* ============================================================== */}
      {selectedParticipantMatchId && (() => {
        const activeMatch = matches.find((m) => m.id === selectedParticipantMatchId);
        if (!activeMatch) return null;

        const players = getJoinedPlayersForMatch(activeMatch);
        const isFinished = activeMatch.status === 'COMPLETED' || isMatchFinished(activeMatch) || (activeMatch.results && activeMatch.results.length > 0);

        const handleCopyAllUids = () => {
          const allUids = players.map((p) => p.uid).filter((u) => u && u !== '---').join('\\n');
          try {
            navigator.clipboard.writeText(allUids);
            setCopiedUidStatus('সকল UID কপি হয়েছে!');
            setTimeout(() => setCopiedUidStatus(null), 2500);
          } catch {}
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-[#161622] rounded-3xl p-6 space-y-5 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-600 border border-red-500/20">
                      {categories[activeMatch.categorySlug]?.name || activeMatch.categorySlug}
                    </span>
                    <span className={\`text-[10px] font-black px-2 py-0.5 rounded-full \${
                      isFinished
                        ? 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    }\`}>
                      {isFinished ? '🏁 সমাপ্ত ম্যাচ (Completed)' : '🟢 রানিং / আসন্ন'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    {activeMatch.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>সময়: <b className="text-gray-700 dark:text-gray-300">{activeMatch.time}</b></span>
                    <span>•</span>
                    <span>ম্যাপ: <b className="text-gray-700 dark:text-gray-300">{activeMatch.map}</b></span>
                    <span>•</span>
                    <span>মোট জয়েনকৃত: <b className="text-emerald-600 font-black">{players.length} জন</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllUids}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-black text-gray-800 dark:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>{copiedUidStatus || '📋 Copy All UIDs'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedParticipantMatchId(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center text-xs font-black"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* First Player Highlight Card */}
              {players.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-dashed border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30 flex-shrink-0">
                      #1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-full">
                          FIRST PLAYER / LEADER
                        </span>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">
                          অ্যাপ ইউজারনেম: <span className="text-red-600 font-extrabold">{players[0].username}</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                        Free Fire IGN: <b>{players[0].ign}</b> | UID: <b className="font-mono text-gray-900 dark:text-white">{players[0].uid}</b> | ফোন: {players[0].phone}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-3 py-1 rounded-xl self-start sm:self-center">
                    স্লট: #{players[0].slot}
                  </span>
                </div>
              )}

              {/* Table of All Joined Players */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-black/40 text-gray-700 dark:text-gray-300 font-black border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="py-3 px-3">স্লট / ক্রম</th>
                      <th className="py-3 px-3">অ্যাপ ইউজারনেম (App Username)</th>
                      <th className="py-3 px-3">ইন-গেম নাম (IGN)</th>
                      <th className="py-3 px-3">ফ্রি ফায়ার UID</th>
                      <th className="py-3 px-3">রেজিস্টার্ড ফোন নম্বর</th>
                      <th className="py-3 px-3">টিম</th>
                      {isFinished && <th className="py-3 px-3 text-right">ম্যাচ ফলাফল</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {players.length === 0 ? (
                      <tr>
                        <td colSpan={isFinished ? 7 : 6} className="py-8 text-center text-gray-500">
                          এই ম্যাচে এখনও কোনো প্লেয়ার জয়েন করেনি।
                        </td>
                      </tr>
                    ) : (
                      players.map((p, idx) => (
                        <tr
                          key={\`\${p.slot}-\${idx}\`}
                          className={\`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors \${
                            idx === 0 ? 'bg-amber-50/50 dark:bg-amber-950/10 font-bold' : ''
                          }\`}
                        >
                          <td className="py-3 px-3">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black \${
                              idx === 0
                                ? 'bg-amber-500 text-black'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                            }\`}>
                              #{p.slot} {idx === 0 ? '(1st)' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900 dark:text-white">
                                {p.username}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                                  FIRST
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-800 dark:text-gray-200">
                            {p.ign}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-red-600 dark:text-red-400 select-all">
                            {p.uid}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-400 font-mono">
                            {p.phone}
                          </td>
                          <td className="py-3 px-3 text-gray-500">
                            Team {p.team || 1}
                          </td>
                          {isFinished && (
                            <td className="py-3 px-3 text-right">
                              {p.rank !== undefined ? (
                                <span className="text-[11px] font-black text-emerald-600">
                                  Rank #{p.rank} ({p.kills || 0} Kills) • ৳{p.prize || 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Completed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                <span className="text-xs text-gray-500 font-semibold">
                  সর্বমোট: {players.length} জন প্লেয়ার নিবন্ধিত
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedParticipantMatchId(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-all"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>
            </div>
          </div>
        );
      })()}
`;

let replaced = false;
if (content.includes(modalTarget)) {
  content = content.replace(modalTarget, participantsSectionUI + "\r\n      " + modalTarget);
  replaced = true;
} else if (content.includes(altModalTarget)) {
  content = content.replace(altModalTarget, participantsSectionUI + "\n      " + altModalTarget);
  replaced = true;
} else {
  // Try finding just ROOM PASS INJECT MODAL
  const fallbackTarget = "{/* ROOM PASS INJECT MODAL";
  if (content.includes(fallbackTarget)) {
    content = content.replace(fallbackTarget, participantsSectionUI + "\n      {/* ROOM PASS INJECT MODAL");
    replaced = true;
  }
}

if (replaced) {
  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('Successfully injected Match Participants Inspector UI into admin/page.tsx!');
} else {
  console.error('Could not find modalTarget insertion point in admin/page.tsx!');
}
