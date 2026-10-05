import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  IO.Socket? socket;
  static const String socketUrl = 'http://10.0.2.2:5000';

  SocketService._internal();

  void initSocket() {
    if (socket != null && socket!.connected) return;

    socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build(),
    );

    socket!.onConnect((_) {
      print('[SOCKET] Connected to real-time esports engine');
    });

    socket!.onDisconnect((_) {
      print('[SOCKET] Disconnected from engine');
    });
  }

  void joinTournamentRoom(String tournamentId) {
    socket?.emit('join_tournament', tournamentId);
  }

  void leaveTournamentRoom(String tournamentId) {
    socket?.emit('leave_tournament', tournamentId);
  }

  void onRoomUnlocked(Function(dynamic) callback) {
    socket?.on('room_unlocked', callback);
  }

  void onSlotUpdated(Function(dynamic) callback) {
    socket?.on('slot_updated', callback);
  }

  void dispose() {
    socket?.disconnect();
    socket?.dispose();
  }
}
