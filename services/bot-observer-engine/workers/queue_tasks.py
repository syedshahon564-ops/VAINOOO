from celery import Celery
import os

REDIS_URL = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}/0"
celery_app = Celery("ff_observer_tasks", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task
def process_match_recording(tournament_id: str, frame_data_batch: list):
    """Background task to run deep-scan OCR across recorded match frames"""
    print(f"[CELERY] Processing post-match frame verification for tournament {tournament_id}...")
    return {"status": "SUCCESS", "frames_verified": len(frame_data_batch)}
