import subprocess
import time
import json
import os

class ADBController:
    def __init__(self, host="127.0.0.1", port=5555):
        self.device_addr = f"{host}:{port}"
        self.coords = self._load_coords()

    def _load_coords(self):
        coords_path = os.path.join(os.path.dirname(__file__), "..", "config", "game_coords.json")
        with open(coords_path, "r") as f:
            return json.load(f)

    def connect(self) -> bool:
        """Connect to local Android emulator via ADB"""
        try:
            cmd = ["adb", "connect", self.device_addr]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            print(f"[ADB] Connect output: {res.stdout.strip()}")
            return "connected" in res.stdout.lower() or "already" in res.stdout.lower()
        except Exception as e:
            print(f"[ADB] Failed to connect: {e}")
            return False

    def tap(self, x: int, y: int):
        subprocess.run(["adb", "-s", self.device_addr, "shell", "input", "tap", str(x), str(y)])

    def type_text(self, text: str):
        subprocess.run(["adb", "-s", self.device_addr, "shell", "input", "text", text])

    def join_custom_room(self, room_id: str, room_pass: str):
        """Automated navigation into Free Fire custom match lobby as spectator"""
        print(f"[ADB] Joining Room ID: {room_id} with Password: {room_pass}")
        targets = self.coords["tap_targets"]

        # 1. Tap search input
        search_x, search_y = targets["custom_room_search_input"]
        self.tap(search_x, search_y)
        time.sleep(0.5)

        # 2. Type Room ID
        self.type_text(room_id)
        time.sleep(0.5)

        # 3. Confirm password
        pass_x, pass_y = targets["password_input_confirm"]
        self.tap(pass_x, pass_y)
        time.sleep(0.5)
        self.type_text(room_pass)
        time.sleep(0.5)

        # 4. Switch to spectator slot
        spec_x, spec_y = targets["switch_to_spectator_slot_1"]
        self.tap(spec_x, spec_y)
        print("[ADB] Bot positioned in Spectator Slot #1. Ready for game start.")
