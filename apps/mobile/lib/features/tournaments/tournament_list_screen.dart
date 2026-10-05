import 'package:flutter/material.dart';
import '../../core/constants/app_theme.dart';
import '../../core/network/api_client.dart';
import 'slot_selection_modal.dart';
import 'room_credentials_modal.dart';

class TournamentListScreen extends StatefulWidget {
  const TournamentListScreen({Key? key}) : super(key: key);

  @override
  State<TournamentListScreen> createState() => _TournamentListScreenState();
}

class _TournamentListScreenState extends State<TournamentListScreen> {
  List<dynamic> tournaments = [
    {
      'id': 'ff-m-101',
      'title': 'FREE FIRE BERMUDA SQUAD CLASH #101',
      'gameMode': 'BR_SQUAD',
      'mapType': 'BERMUDA',
      'entryFee': 100,
      'prizePool': 5000,
      'perKillPrize': 15,
      'totalSlots': 48,
      'filledSlots': 42,
      'status': 'UPCOMING',
    },
    {
      'id': 'ff-m-102',
      'title': 'FREE FIRE PURGATORY SOLO RUSH #102',
      'gameMode': 'BR_SOLO',
      'mapType': 'PURGATORY',
      'entryFee': 50,
      'prizePool': 2500,
      'perKillPrize': 10,
      'totalSlots': 48,
      'filledSlots': 36,
      'status': 'UPCOMING',
    },
    {
      'id': 'ff-m-103',
      'title': 'FREE FIRE KALAHARI DUO ELITE #103',
      'gameMode': 'BR_DUO',
      'mapType': 'KALAHARI',
      'entryFee': 80,
      'prizePool': 3800,
      'perKillPrize': 12,
      'totalSlots': 48,
      'filledSlots': 28,
      'status': 'UPCOMING',
    },
    {
      'id': 'ff-m-104',
      'title': 'CS 4v4 MIDNIGHT SHOWDOWN #104',
      'gameMode': 'CS_SQUAD',
      'mapType': 'BERMUDA',
      'entryFee': 120,
      'prizePool': 6000,
      'perKillPrize': 20,
      'totalSlots': 16,
      'filledSlots': 14,
      'status': 'UPCOMING',
    },
  ];
  bool loading = false;

  @override
  void initState() {
    super.initState();
    loadTournaments();
  }

  void loadTournaments() async {
    try {
      final res = await ApiClient().getTournaments();
      if (mounted && res.data != null && res.data['tournaments'] != null) {
        setState(() {
          tournaments = res.data['tournaments'];
        });
      }
    } catch (_) {
      // Offline fallback already active
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LIVE TOUR BD'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: AppTheme.primaryGold),
            onPressed: () {},
          )
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGold))
          : RefreshIndicator(
              onRefresh: () async => loadTournaments(),
              color: AppTheme.primaryGold,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: tournaments.length,
                itemBuilder: (context, index) {
                  final t = tournaments[index];
                  final double progress = (t['filledSlots'] ?? 0) / (t['totalSlots'] ?? 48);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 18),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.cardDark,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryGold.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                t['gameMode'].toString().replaceAll('_', ' '),
                                style: const TextStyle(
                                  color: AppTheme.primaryGold,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                            Text(
                              'Map: ${t['mapType']}',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          t['title'],
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildStat('ENTRY FEE', 'BDT ${t['entryFee']}', AppTheme.emeraldGreen),
                              _buildStat('PRIZE POOL', 'BDT ${t['prizePool']}', AppTheme.primaryGold),
                              _buildStat('PER KILL', 'BDT ${t['perKillPrize']}', AppTheme.neonCyan),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(
                              '${t['filledSlots']}/${t['totalSlots']} Slots Filled',
                              style: const TextStyle(color: Colors.grey, fontSize: 11),
                            ),
                            InkWell(
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => RoomCredentialsModal(tournamentId: t['id']),
                                );
                              },
                              child: const Text(
                                'Room Info 🔑',
                                style: TextStyle(color: AppTheme.primaryGold, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: Colors.white10,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGold),
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          height: 42,
                          child: ElevatedButton(
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (_) => SlotSelectionModal(
                                  tournament: t,
                                  onBooked: () {
                                    loadTournaments();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Slot booked! Check Room Info before match time.')),
                                    );
                                  },
                                ),
                              );
                            },
                            child: const Text('JOIN MATCH'),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.extrabold)),
      ],
    );
  }
}
