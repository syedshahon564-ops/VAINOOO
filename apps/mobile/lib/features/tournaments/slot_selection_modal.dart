import 'package:flutter/material.dart';
import '../../core/constants/app_theme.dart';
import '../../core/network/api_client.dart';

class SlotSelectionModal extends StatefulWidget {
  final Map<String, dynamic> tournament;
  final VoidCallback onBooked;

  const SlotSelectionModal({
    Key? key,
    required this.tournament,
    required this.onBooked,
  }) : super(key: key);

  @override
  State<SlotSelectionModal> createState() => _SlotSelectionModalState();
}

class _SlotSelectionModalState extends State<SlotSelectionModal> {
  int? selectedSlot;
  final TextEditingController teamController = TextEditingController();
  bool loading = false;
  String? error;

  void bookSlot() async {
    if (selectedSlot == null) return;
    setState(() {
      loading = true;
      error = null;
    });

    try {
      await ApiClient().joinSlot(
        widget.tournament['id'],
        selectedSlot!,
        teamController.text.trim().isEmpty ? null : teamController.text.trim(),
      );
      Navigator.pop(context);
      widget.onBooked();
    } catch (e: any) {
      setState(() {
        error = e.toString().contains('balance')
            ? 'Insufficient wallet balance. Please recharge via bKash/Nagad.'
            : 'Slot is already taken or registration closed.';
      });
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final int totalSlots = widget.tournament['totalSlots'] ?? 48;
    final int filledSlots = widget.tournament['filledSlots'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(
                'Select Slot (Entry: ৳${widget.tournament['entryFee']})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.grey),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          if (error != null)
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: AppTheme.roseRed.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(error!, style: const TextStyle(color: AppTheme.roseRed, fontSize: 12)),
            ),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.1,
              ),
              itemCount: totalSlots,
              itemBuilder: (context, index) {
                final slotNum = index + 1;
                final isTaken = slotNum <= filledSlots;
                final isSelected = selectedSlot == slotNum;

                return InkWell(
                  onTap: isTaken ? null : () => setState(() => selectedSlot = slotNum),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryGold
                          : isTaken
                              ? Colors.white.withOpacity(0.04)
                              : AppTheme.emeraldGreen.withOpacity(0.12),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.primaryGold
                            : isTaken
                                ? Colors.transparent
                                : AppTheme.emeraldGreen.withOpacity(0.3),
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '#$slotNum',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? Colors.black
                            : isTaken
                                ? Colors.grey[700]
                                : AppTheme.emeraldGreen,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: teamController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Team / Squad Name (Optional)',
              hintStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: Colors.black45,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: selectedSlot == null || loading ? null : bookSlot,
              child: Text(
                loading ? 'Booking Slot...' : 'Confirm Slot #${selectedSlot ?? ''} & Pay ৳${widget.tournament['entryFee']}',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
