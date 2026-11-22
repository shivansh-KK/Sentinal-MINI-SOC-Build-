import json
from typing import List, Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        payload = json.dumps(message, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

    async def broadcast_event(self, event_data: Dict[str, Any]):
        await self.broadcast({"type": "NEW_EVENT", "data": event_data})

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        await self.broadcast({"type": "NEW_ALERT", "data": alert_data})

    async def broadcast_incident(self, incident_data: Dict[str, Any]):
        await self.broadcast({"type": "NEW_INCIDENT", "data": incident_data})

    async def broadcast_response(self, response_data: Dict[str, Any]):
        await self.broadcast({"type": "RESPONSE_ACTION", "data": response_data})

    async def broadcast_metrics(self, metrics_data: Dict[str, Any]):
        await self.broadcast({"type": "METRICS_UPDATE", "data": metrics_data})

ws_manager = ConnectionManager()
