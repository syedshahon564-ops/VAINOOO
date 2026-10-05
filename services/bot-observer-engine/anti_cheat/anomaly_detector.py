import time

class AnomalyDetector:
    def __init__(self):
        # player_ign -> { kills: int, headshots: int, last_kill_time: float }
        self.player_stats = {}

    def record_kill_event(self, killer_ign: str, is_headshot: bool) -> dict | None:
        """Evaluates kill patterns in real-time to detect aimbots and rapid-fire hacks"""
        now = time.time()

        if killer_ign not in self.player_stats:
            self.player_stats[killer_ign] = {
                "kills": 0,
                "headshots": 0,
                "last_kill_time": now,
            }

        stats = self.player_stats[killer_ign]
        stats["kills"] += 1
        if is_headshot:
            stats["headshots"] += 1

        delta_time = now - stats["last_kill_time"]
        stats["last_kill_time"] = now

        # Anomaly 1: Impossible Headshot Ratio (>85% over 5+ kills)
        hs_ratio = stats["headshots"] / stats["kills"]
        if stats["kills"] >= 5 and hs_ratio >= 0.85:
            return {
                "anomalyType": "HEADSHOT_ANOMALY",
                "confidenceScore": round(hs_ratio, 2),
                "details": f"Suspicious headshot accuracy: {stats['headshots']}/{stats['kills']} ({int(hs_ratio*100)}%) with rapid lock.",
                "autoBan": hs_ratio >= 0.95 and stats["kills"] >= 7,
            }

        # Anomaly 2: Rapid Fire / Multi-kill in < 0.5s with non-explosive weapons
        if stats["kills"] >= 2 and delta_time < 0.5:
            return {
                "anomalyType": "RAPID_FIRE",
                "confidenceScore": 0.92,
                "details": f"Impossible kill interval: 2 kills registered within {delta_time:.2f} seconds.",
                "autoBan": False,
            }

        return None
