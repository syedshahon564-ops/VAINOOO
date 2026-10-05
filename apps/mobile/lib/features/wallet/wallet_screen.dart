import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_theme.dart';
import '../../core/network/api_client.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? key}) : super(key: key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  String selectedMethod = 'BKASH';
  final TextEditingController amountController = TextEditingController(text: '100');
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController trxController = TextEditingController();

  bool loading = false;
  String? message;

  void submitDeposit() async {
    setState(() {
      loading = true;
      message = null;
    });

    try {
      final res = await ApiClient().requestDeposit(
        selectedMethod,
        double.parse(amountController.text),
        phoneController.text.trim(),
        trxController.text.trim(),
      );
      setState(() {
        message = 'Deposit request submitted successfully!';
        trxController.clear();
        phoneController.clear();
      });
    } catch (e) {
      setState(() => message = 'Failed to submit deposit. Check your TrxID.');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('WALLET & PAYOUT')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance Tile
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E1E2E), Color(0xFF12121C)]),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.primaryGold.withOpacity(0.4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('AVAILABLE BALANCE', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                      SizedBox(height: 6),
                      Text('৳ 1,450.00', style: TextStyle(color: AppTheme.primaryGold, fontSize: 26, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.pink.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: const Text('bKash', style: TextStyle(color: Colors.pinkAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.orange.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: const Text('Nagad', style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (message != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: AppTheme.emeraldGreen.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                child: Text(message!, style: const TextStyle(color: AppTheme.emeraldGreen, fontSize: 13)),
              ),

            const Text('Deposit Funds (Instant)', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // Provider Selector
            Row(
              children: ['BKASH', 'NAGAD', 'ROCKET'].map((m) {
                final isSelected = selectedMethod == m;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => selectedMethod = m),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primaryGold.withOpacity(0.2) : Colors.black45,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isSelected ? AppTheme.primaryGold : Colors.white12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        m,
                        style: TextStyle(
                          color: isSelected ? AppTheme.primaryGold : Colors.grey,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Sender Phone
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Your $selectedMethod Number',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: Colors.black45,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 12),

            // Amount
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Deposit Amount (BDT)',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: Colors.black45,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 12),

            // TrxID
            TextField(
              controller: trxController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Transaction ID (TrxID)',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: Colors.black45,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: loading ? null : submitDeposit,
                child: Text(loading ? 'Submitting...' : 'SUBMIT DEPOSIT'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
