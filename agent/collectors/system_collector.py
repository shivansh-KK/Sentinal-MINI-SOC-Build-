import socket
import platform
from typing import Dict, Any

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

class SystemCollector:
    @staticmethod
    def get_primary_ip() -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    @staticmethod
    def collect_metadata() -> Dict[str, Any]:
        data = {
            "hostname": socket.gethostname(),
            "ip_address": SystemCollector.get_primary_ip(),
            "os_type": platform.system(),
            "os_version": f"{platform.system()} {platform.release()}",
            "architecture": platform.machine(),
            "processor": platform.processor() or "Generic x86_64",
        }

        if HAS_PSUTIL:
            try:
                data["cpu_percent"] = psutil.cpu_percent(interval=None)
                data["memory_percent"] = psutil.virtual_memory().percent
                data["disk_percent"] = psutil.disk_usage("/").percent if platform.system() != "Windows" else psutil.disk_usage("C:").percent
            except Exception:
                pass

        return data
