import 'package:flutter/material.dart';

class AppTheme {
  static const Color bgDark = Color(0xFF07070A);
  static const Color cardDark = Color(0xFF12121C);
  static const Color cardBorder = Color(0x1AFFFFFF);

  // Live Tour BD / FF Rivals Gold
  static const Color primaryGold = Color(0xFFD4AF37);
  static const Color secondaryGold = Color(0xFFF1C40F);
  static const Color goldGlow = Color(0x40D4AF37);

  // Accent & Action
  static const Color neonCyan = Color(0xFF00FFD5);
  static const Color emeraldGreen = Color(0xFF10B981);
  static const Color roseRed = Color(0xFFF43F5E);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bgDark,
    primaryColor: primaryGold,
    cardColor: cardDark,
    // Ultra-fast tactile feedback - 0ms delay
    splashFactory: InkRipple.splashFactory,
    highlightColor: primaryGold.withOpacity(0.12),
    splashColor: primaryGold.withOpacity(0.24),
    appBarTheme: const AppBarTheme(
      backgroundColor: bgDark,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF0B0B12),
      selectedItemColor: primaryGold,
      unselectedItemColor: Colors.grey,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGold,
        foregroundColor: Colors.black,
        textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 3,
        animationDuration: Duration.zero, // Instant button touch response
      ),
    ),
  );
}
