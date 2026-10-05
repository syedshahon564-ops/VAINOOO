import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/constants/app_theme.dart';
import 'core/websocket/socket_service.dart';
import 'features/tournaments/tournament_list_screen.dart';
import 'features/wallet/wallet_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Asynchronously initialize socket in the background without blocking the UI
  try {
    SocketService().initSocket();
  } catch (_) {}

  runApp(const FFRivalsTourApp());
}

class FFRivalsTourApp extends StatelessWidget {
  const FFRivalsTourApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FF Rivals Tour',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      // Directly loads the main Tournament Dashboard on app start
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  bool isLoggedIn = false;
  String username = 'Striker_BD';
  String gameUid = '789234156';

  @override
  void initState() {
    super.initState();
    _checkAuthQuickly();
  }

  void _checkAuthQuickly() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (mounted && token != null) {
        setState(() {
          isLoggedIn = true;
          username = prefs.getString('username') ?? 'Striker_BD';
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    // IndexedStack keeps all tabs alive in memory for instant 0ms tap switching
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const TournamentListScreen(),
          const WalletScreen(),
          _buildProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          elevation: 10,
          backgroundColor: const Color(0xFF09090F),
          selectedItemColor: AppTheme.primaryGold,
          unselectedItemColor: Colors.grey,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          type: BottomNavigationBarType.fixed,
          onTap: (index) {
            // Immediate state change on tap
            setState(() => _currentIndex = index);
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.sports_esports_outlined),
              activeIcon: Icon(Icons.sports_esports, color: AppTheme.primaryGold),
              label: 'Tournaments',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet, color: AppTheme.primaryGold),
              label: 'Wallet & Payout',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person, color: AppTheme.primaryGold),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileScreen() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PLAYER PROFILE'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1B1B2A), Color(0xFF11111B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.primaryGold.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primaryGold, width: 2),
                      color: Colors.black45,
                    ),
                    child: const Icon(Icons.person, size: 38, color: AppTheme.primaryGold),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          username,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'FF UID: $gameUid',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade400,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.emeraldGreen.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'PRO TIER ACTIVE',
                            style: TextStyle(
                              color: AppTheme.emeraldGreen,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _buildActionTile(
              icon: Icons.history_toggle_off,
              title: 'Match History & Results',
              subtitle: 'Check your kill stats and prize claims',
              onTap: () {},
            ),
            const SizedBox(height: 12),

            _buildActionTile(
              icon: Icons.headset_mic_outlined,
              title: '24/7 Support Helpline',
              subtitle: 'WhatsApp & Telegram live admin help',
              onTap: () {},
            ),
            const SizedBox(height: 12),

            _buildActionTile(
              icon: Icons.rule_folder_outlined,
              title: 'Tournament Fair Play Rules',
              subtitle: 'No emulators, no cheats, strictly mobile',
              onTap: () {},
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.roseRed,
                  side: const BorderSide(color: AppTheme.roseRed, width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('LOGOUT / RESET SESSION', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () async {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.clear();
                  if (mounted) {
                    setState(() {
                      isLoggedIn = false;
                      username = 'Guest Player';
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Logged out successfully.')),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.cardBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryGold.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primaryGold, size: 22),
        ),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
        subtitle: Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
        trailing: const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 14),
        onTap: onTap,
      ),
    );
  }
}
