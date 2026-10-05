import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export class SocketManager {
  private static instance: SocketManager;
  public io: SocketIOServer;

  private constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
  }

  public static init(server: HttpServer): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager(server);
    }
    return SocketManager.instance;
  }

  public static getInstance(): SocketManager {
    return SocketManager.instance;
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      // Player joins a tournament room for live slot and countdown updates
      socket.on('join_tournament', (tournamentId: string) => {
        socket.join(`tournament_${tournamentId}`);
      });

      socket.on('leave_tournament', (tournamentId: string) => {
        socket.leave(`tournament_${tournamentId}`);
      });

      // Admin & Spectator live feed
      socket.on('join_spectator_channel', (tournamentId: string) => {
        socket.join(`spectator_${tournamentId}`);
      });
    });
  }

  public emitSlotUpdate(tournamentId: string, data: any) {
    this.io.to(`tournament_${tournamentId}`).emit('slot_updated', data);
  }

  public emitRoomUnlocked(tournamentId: string, data: { roomId: string; roomPass: string }) {
    this.io.to(`tournament_${tournamentId}`).emit('room_unlocked', data);
  }

  public emitKillfeedEvent(tournamentId: string, event: any) {
    this.io.to(`spectator_${tournamentId}`).emit('killfeed_event', event);
    this.io.to(`tournament_${tournamentId}`).emit('live_kill', event);
  }

  public emitAntiCheatAlert(report: any) {
    this.io.emit('anti_cheat_alert', report);
  }
}
