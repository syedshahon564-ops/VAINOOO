from PIL import Image
import pytesseract
import json
import os
import re
from .visual_debugger import VisualDebugger

class ScoreboardParser:
    def __init__(self):
        coords_path = os.path.join(os.path.dirname(__file__), "..", "config", "game_coords.json")
        with open(coords_path, "r") as f:
            cfg = json.load(f)
            self.booyah_box = cfg["booyah_banner_box"]
            self.ranks_box = cfg["scoreboard_ranks_box"]

    def is_booyah_banner_present(self, full_frame: Image.Image) -> bool:
        """Detects if victory / Booyah banner appeared on screen"""
        box = (self.booyah_box["x1"], self.booyah_box["y1"], self.booyah_box["x2"], self.booyah_box["y2"])
        cropped = full_frame.crop(box)
        try:
            text = pytesseract.image_to_string(cropped, config="--psm 7").lower()
            return "booyah" in text or "victory" in text
        except Exception:
            return False

    def parse_final_ranks(self, full_frame: Image.Image):
        """Extracts leaderboard rows: Rank #1, #2, #3, Player Names, Kills, Damage"""
        box = (self.ranks_box["x1"], self.ranks_box["y1"], self.ranks_box["x2"], self.ranks_box["y2"])
        cropped = full_frame.crop(box)
        processed = VisualDebugger.preprocess_for_ocr(cropped)

        try:
            text = pytesseract.image_to_string(processed, config="--psm 6")
        except Exception:
            text = ""

        results = []
        rank_counter = 1

        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Look for number patterns (kills and damage)
            numbers = re.findall(r"\d+", line)
            kills = int(numbers[0]) if len(numbers) >= 1 else 0
            damage = int(numbers[1]) if len(numbers) >= 2 else 0

            # Clean name
            cleaned_name = re.sub(r"[\d#\(\)\[\]]", "", line).strip()
            if cleaned_name:
                results.append({
                    "rank": rank_counter,
                    "teamOrPlayer": cleaned_name,
                    "kills": kills,
                    "damage": damage,
                    "isBooyah": rank_counter == 1,
                })
                rank_counter += 1

        return results
