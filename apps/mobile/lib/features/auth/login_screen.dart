import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_theme.dart';
import '../../core/network/api_client.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  const LoginScreen({Key? key, required this.onLoginSuccess}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool isRegister = false;
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController ignController = TextEditingController();
  final TextEditingController uidController = TextEditingController();

  bool loading = false;
  String? error;

  void handleSubmit() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      if (isRegister) {
        final res = await ApiClient().register(
          phoneController.text.trim(),
          passwordController.text,
          ignController.text.trim(),
          uidController.text.trim(),
        );
        final token = res.data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        widget.onLoginSuccess();
      } else {
        final res = await ApiClient().login(
          phoneController.text.trim(),
          passwordController.text,
        );
        final token = res.data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        widget.onLoginSuccess();
      }
    } catch (e: any) {
      setState(() {
        error = 'Authentication failed. Please verify your details.';
      });
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppTheme.primaryGold, AppTheme.secondaryGold]),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(color: AppTheme.primaryGold.withOpacity(0.4), blurRadius: 15),
                    ],
                  ),
                  child: const Icon(Icons.emoji_events, color: Colors.black, size: 36),
                ),
                const SizedBox(height: 16),
                const Text(
                  'LIVE TOUR BD',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 2),
                ),
                const Text(
                  'Esports Tournament Arena',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 32),

                if (error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.roseRed.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(error!, style: const TextStyle(color: AppTheme.roseRed, fontSize: 12)),
                  ),

                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Phone Number (Bangladesh)',
                    labelStyle: const TextStyle(color: Colors.grey),
                    prefixIcon: const Icon(Icons.phone, color: AppTheme.primaryGold, size: 18),
                    filled: true,
                    fillColor: Colors.black45,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),

                if (isRegister) ...[
                  TextField(
                    controller: ignController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'Free Fire In-Game Name (IGN)',
                      labelStyle: const TextStyle(color: Colors.grey),
                      prefixIcon: const Icon(Icons.person, color: AppTheme.primaryGold, size: 18),
                      filled: true,
                      fillColor: Colors.black45,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: uidController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'Free Fire UID',
                      labelStyle: const TextStyle(color: Colors.grey),
                      prefixIcon: const Icon(Icons.tag, color: AppTheme.primaryGold, size: 18),
                      filled: true,
                      fillColor: Colors.black45,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                TextField(
                  controller: passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    labelStyle: const TextStyle(color: Colors.grey),
                    prefixIcon: const Icon(Icons.lock, color: AppTheme.primaryGold, size: 18),
                    filled: true,
                    fillColor: Colors.black45,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: loading ? null : handleSubmit,
                    child: Text(loading ? 'Please wait...' : (isRegister ? 'REGISTER NOW' : 'LOGIN TO ARENA')),
                  ),
                ),
                const SizedBox(height: 14),

                TextButton(
                  onPressed: () => setState(() => isRegister = !isRegister),
                  child: Text(
                    isRegister ? 'Already have an account? Login' : "Don't have an account? Register Free",
                    style: const TextStyle(color: AppTheme.primaryGold, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
