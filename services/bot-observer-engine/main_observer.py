import time
import requests
from config.settings import API_BASE_URL, BOT_CALLBACK_SECRET, ADB_HOST, ADB_PORT
from emulator.adb_controller import ADBController
from emulator.frame_streamer import FrameStreamer
from vision.killfeed_ocr import KillfeedOCR
from vision.scoreboard_parser import ScoreboardParser
from anti_cheat.anomaly_detector import AnomalyDetector
from anti_cheat.ban_dispatcher import BanDispatcher

class AutonomousObserverEngine:
    def __init__(self):
        print("=" * 60)
        print("  LIVE TOUR BD • AUTONOMOUS SPECTATOR & OCR ENGINE")
        print("=" * 60)
        self.adb = ADBController(host=ADB_HOST, port=ADB_PORT)
        self.streamer = FrameStreamer(device_addr=f"{ADB_HOST}:{ADB_PORT}")
        self.killfeed_ocr = KillfeedOCR()
        self.scoreboard_parser = ScoreboardParser()
        self.anomaly_detector = AnomalyDetector()

    def start_match_monitoring(self, tournament_id: str, room_id: str, room_pass: str):
        print(f"[OBSERVER] Initializing custom room auto-join sequence for {tournament_id}...")
        is_connected = self.adb.connect()
        if is_connected:
            self.adb.join_custom_room(room_id, room_pass)
        else:
            print("[OBSERVER] Running in standalone stream mode (No direct ADB connected).")

        print("[OBSERVER] Live frame vision loop active. Scanning killfeed at 100ms intervals...")

        loop_count = 0
        try:
            while loop_count < 100: # Runs during active game
                frame = self.streamer.capture_frame()

                # 1. OCR Kill-Feed Parse
                kill_events = self.killfeed_ocr.extract_kills(frame)
                for event in kill_events:
                    print(f"[KILLFEED OCR] {event['killerIgn']} -> {event['victimIgn']} ({event['weapon']}) [HS: {event['isHeadshot']}]")

                    # Dispatch to backend websocket
                    self._post_kill_event(tournament_id, event)

                    # 2. Real-time Anti-Cheat evaluation
                    anomaly = self.anomaly_detector.record_kill_event(event["killerIgn"], event["isHeadshot"])
                    if anomaly:
                        print(f"[ALERT] Anti-Cheat Flag detected on {event['killerIgn']}: {anomaly['details']}")
                        BanDispatcher.dispatch_anomaly(tournament_id, event["killerIgn"], anomaly)

                # 3. Check for Booyah / Victory banner
                if self.scoreboard_parser.is_booyah_banner_present(frame):
                    print("[OBSERVER] BOOYAH DETECTED! Parsing final match scoreboard...")
                    results = self.scoreboard_parser.parse_final_ranks(frame)
                    print(f"[OBSERVER] Final Leaderboard extracted: {len(results)} teams.")
                    break

                time.sleep(0.5)
                loop_count += 1

        except KeyboardInterrupt:
            print("[OBSERVER] Spectator engine manually stopped.")

    def _post_kill_event(self, tournament_id: str, event: dict):
        url = f"{API_BASE_URL}/security/webhook/killfeed"
        headers = {
            "Content-Type": "application/json",
            "x-bot-secret": BOT_CALLBACK_SECRET,
        }
        payload = {
            "tournamentId": tournament_id,
            "killerIgn": event["killerIgn"],
            "victimIgn": event["victimIgn"],
            "weapon": event["weapon"],
            "isHeadshot": event["isHeadshot"],
        }
        try:
            requests.post(url, json=payload, headers=headers, timeout=2)
        except Exception:
            pass

if __name__ == "__main__":
    observer = AutonomousObserverEngine()
    # Demo test run
    observer.start_match_monitoring(
        tournament_id="demo-tournament-42",
        room_id="7892182",
        room_pass="1234",
    )
