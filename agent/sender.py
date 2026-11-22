import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [SENTINEL-AGENT] %(message)s")
logger = logging.getLogger("sentinel_agent")

class EventSender:
    def __init__(self, backend_url: str, api_key: str):
        self.backend_url = backend_url.rstrip("/")
        self.api_key = api_key

    def send_heartbeat(self, payload: Dict[str, Any]) -> bool:
        url = f"{self.backend_url}/endpoints/heartbeat"
        return self._post_json(url, payload)

    def send_event(self, event_data: Dict[str, Any]) -> bool:
        url = f"{self.backend_url}/events/ingest"
        return self._post_json(url, event_data)

    def _post_json(self, url: str, data: Dict[str, Any]) -> bool:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-API-KEY": self.api_key,
                    "User-Agent": "Sentinel-Endpoint-Agent/1.0.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status in (200, 201):
                    return True
                logger.warning(f"Unexpected response status: {response.status}")
                return False
        except urllib.error.URLError as e:
            logger.error(f"Network error connecting to {url}: {e.reason}")
            return False
        except Exception as e:
            logger.error(f"Failed to post telemetry: {str(e)}")
            return False
