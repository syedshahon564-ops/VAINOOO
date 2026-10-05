from PIL import Image
import pytesseract
import json
import os
import re
from .visual_debugger import VisualDebugger

class KillfeedOCR:
    def __init__(self):
        coords_path = os.path.join(os.path.dirname(__file__), "..", "config", "game_coords.json")
        with open(coords_path, "r") as f:
            self.coords = json.load(f)["killfeed_box"]

    def extract_kills(self, full_frame: Image.Image):
        """Crops the top-right killfeed region and extracts kill lines"""
        box = (self.coords["x1"], self.coords["y1"], self.coords["x2"], self.coords["y2"])
        cropped = full_frame.crop(box)
        processed = VisualDebugger.preprocess_for_ocr(cropped)

        try:
            # Custom Tesseract configuration for single block of text
            text = pytesseract.image_to_string(processed, config="--psm 6")
        except Exception:
            text = ""

        events = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Look for common Free Fire weapons and headshot indicators
            is_headshot = bool(re.search(r"(headshot|hs|\bhs\b)", line, re.I))
            # Example format: "PlayerA [M1887] PlayerB" or "PlayerA eliminated PlayerB"
            parts = re.split(r"(\[.*?\]|eliminated|knocked\s*down)", line, flags=re.I)
            if len(parts) >= 3:
                killer = parts[0].strip()
                weapon = parts[1].replace("[", "").replace("]", "").strip()
                victim = parts[2].strip()

                if killer and victim:
                    events.append({
                        "killerIgn": killer,
                        "victimIgn": victim,
                        "weapon": weapon or "Combat",
                        "isHeadshot": is_headshot,
                    })

        return events
