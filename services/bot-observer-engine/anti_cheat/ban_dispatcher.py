import requests
from ..config.settings import API_BASE_URL, BOT_CALLBACK_SECRET

class BanDispatcher:
    @staticmethod
    def dispatch_anomaly(tournament_id: str, ign: str, anomaly_data: dict):
        """Sends detected anomaly and auto-ban signal to Central Fastify Backend"""
        url = f"{API_BASE_URL}/security/webhook/anomaly"
        headers = {
            "Content-Type": "application/json",
            "x-bot-secret": BOT_CALLBACK_SECRET,
        }
        payload = {
            "tournamentId": tournament_id,
            "ign": ign,
            "anomalyType": anomaly_data["anomalyType"],
            "confidenceScore": anomaly_data["confidenceScore"],
            "details": anomaly_data["details"],
            "autoBan": anomaly_data.get("autoBan", False),
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            print(f"[ANTI-CHEAT] Dispatched alert for {ign}: HTTP {res.status_code}")
            return res.json()
        except Exception as e:
            print(f"[ANTI-CHEAT] Failed to dispatch alert: {e}")
            return None
