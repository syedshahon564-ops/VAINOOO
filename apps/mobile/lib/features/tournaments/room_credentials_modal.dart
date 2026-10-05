import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_theme.dart';
import '../../core/network/api_client.dart';

class RoomCredentialsModal extends StatefulWidget {
  final String tournamentId;
  const RoomCredentialsModal({Key? key, required this.tournamentId}) : super(key: key);

  @override
  State<RoomCredentialsModal> createState() => _RoomCredentialsModalState();
}

class _RoomCredentialsModalState extends State<RoomCredentialsModal> {
  bool loading = true;
  Map<String, dynamic>? data;
  String? error;

  @override
  void initState() {
    super.initState();
    loadCredentials();
  }

  void loadCredentials() async {
    try {
      final res = await ApiClient().getRoomCredentials(widget.tournamentId);
      setState(() {
        data = res.data;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = 'You must be registered in this match to view room credentials.';
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Custom Room Credentials', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),
          if (loading)
            const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: AppTheme.primaryGold)))
          else if (error != null)
            Text(error!, style: const TextStyle(color: AppTheme.roseRed, fontSize: 13), textAlign: TextAlign.center)
          else if (data?['isLocked'] == true)
            Column(
              children: [
                const Icon(Icons.lock_clock, color: AppTheme.secondaryGold, size: 48),
                const SizedBox(height: 12),
                const Text('Credentials Locked', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  data?['message'] ?? 'Room ID & Password will unlock 15 minutes before match start.',
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ],
            )
          else
            Column(
              children: [
                _buildCopyTile('Room ID', data?['roomId'] ?? 'Waiting Host Setup', AppTheme.primaryGold),
                const SizedBox(height: 12),
                _buildCopyTile('Password', data?['roomPass'] ?? 'Waiting Host Setup', AppTheme.neonCyan),
              ],
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildCopyTile(String title, String val, Color highlight) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              Text(val, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: highlight, letterSpacing: 2)),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.copy, color: Colors.white70, size: 20),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: val));
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title copied!')));
            },
          )
        ],
      ),
    );
  }
}
