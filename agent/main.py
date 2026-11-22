import time
import sys
import os
import logging
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.config.config import config
from agent.collectors.system_collector import SystemCollector
from agent.sender import EventSender, logger

def run_agent():
    logger.info(f"Starting SENTINEL Endpoint Security Agent v{config.AGENT_VERSION} on {config.HOSTNAME}...")
    logger.info(f"Backend Target: {config.BACKEND_URL}")

    sender = EventSender(config.BACKEND_URL, config.API_KEY)
    last_heartbeat = 0

    # Initial register event
    meta = SystemCollector.collect_metadata()
    logger.info(f"System Metadata Collected: Host={meta['hostname']} IP={meta['ip_address']} OS={meta['os_version']}")

    sender.send_event({
        "timestamp": datetime.utcnow().isoformat(),
        "source": "agent",
        "hostname": config.HOSTNAME,
        "source_ip": meta["ip_address"],
        "event_type": "agent_started",
        "category": "system",
        "severity": "info",
        "message": f"SENTINEL Endpoint Agent v{config.AGENT_VERSION} initialized on {config.HOSTNAME} ({meta['os_version']})",
    })

    try:
        while True:
            current_time = time.time()
            if current_time - last_heartbeat >= config.HEARTBEAT_INTERVAL:
                meta = SystemCollector.collect_metadata()
                success = sender.send_heartbeat({
                    "hostname": config.HOSTNAME,
                    "ip_address": meta["ip_address"],
                    "os_type": config.OS_TYPE,
                    "os_version": config.OS_VERSION,
                    "agent_version": config.AGENT_VERSION
                })
                if success:
                    logger.info(f"Heartbeat synchronized successfully with SOC backend.")
                last_heartbeat = current_time

            time.sleep(config.EVENT_POLL_INTERVAL)
    except KeyboardInterrupt:
        logger.info("Agent shutdown signal received. Exiting safely.")

if __name__ == "__main__":
    run_agent()
