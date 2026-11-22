import os
import socket
import platform

class AgentConfig:
    BACKEND_URL = os.getenv("SENTINEL_BACKEND_URL", "http://127.0.0.1:8000/api/v1")
    API_KEY = os.getenv("SENTINEL_API_KEY", "stnl_lab_agent_default_secret")
    HOSTNAME = os.getenv("SENTINEL_HOSTNAME", socket.gethostname())
    HEARTBEAT_INTERVAL = int(os.getenv("SENTINEL_HEARTBEAT_INTERVAL", "15"))
    EVENT_POLL_INTERVAL = int(os.getenv("SENTINEL_POLL_INTERVAL", "5"))
    OS_TYPE = platform.system()
    OS_VERSION = f"{platform.system()} {platform.release()} ({platform.version()[:20]})"
    AGENT_VERSION = "1.0.0"

config = AgentConfig()
