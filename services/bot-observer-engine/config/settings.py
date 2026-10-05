import os
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_URL", "http://localhost:5000/api/v1")
BOT_CALLBACK_SECRET = os.getenv("BOT_CALLBACK_SECRET", "secure_bot_engine_signature_token")

ADB_HOST = os.getenv("ADB_HOST", "127.0.0.1")
ADB_PORT = int(os.getenv("ADB_PORT", 5555))
SPECTATOR_SLOT = int(os.getenv("BOT_SPECTATOR_SLOT", 1))

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Anti-cheat thresholds
MAX_HEADSHOT_PERCENTAGE = 0.85 # Flag if >85% headshots over 6+ kills
IMPOSSIBLE_KILL_INTERVAL_SECONDS = 0.8 # Flag if 2 kills in <800ms
