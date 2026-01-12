import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import time
import json
from typing import Dict

# Importaciones de modelos y base de datos
from app.models.base import Base
from app.db.session import engine
from app import models
from app.models import user, solicitud, servicio, evidencia, wallet

# Importaciones de rutas
from app.api.v1 import routes
from app.api.v1 import routes_auth
from app.api.v1.routes import router as api_router
from app.services import realtime

# Crear la aplicación FastAPI
app = FastAPI()

# --- CONFIGURACIÓN DE CORS CORREGIDA ---
# Lista de URLs permitidas para que el registro no falle
origins = [
    "https://reciyap.netlify.app",       # Tu app en Netlify
    "http://localhost:5173",             # Tu app local en puerto 5173
    "http://localhost:3008",             # Tu app local en puerto 3008
    "*"                                  # Permite todo (comodín para Tunnelmole)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gestor de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        self.active_connections[user_id] = websocket
        print(f"✅ Cliente conectado: {user_id}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ Cliente desconectado: {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Error enviando mensaje a {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
        print(f"📢 Broadcasting a {len(self.active_connections)} conexiones activas")
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
                print(f"   ✅ Mensaje enviado a usuario {user_id}")
            except Exception as e:
                print(f"   ❌ Error enviando a usuario {user_id}: {e}")
                disconnected_users.append(user_id)
        
        for user_id in disconnected_users:
            self.disconnect(user_id)

manager = ConnectionManager()

# Evento de startup para crear tablas
@app.on_event("startup")
async def startup_event():
    max_retries = 30
    retry_interval = 2
    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Tablas creadas exitosamente")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ Esperando a la base de datos... intento {attempt + 1}")
                time.sleep(retry_interval)
            else:
                raise

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    await manager.connect(user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")

            if message_type == "nueva_solicitud":
                await manager.broadcast({"type": "nueva_solicitud", "solicitud": message.get("solicitud")})
            elif message_type == "aceptar_solicitud":
                await manager.broadcast({"type": "solicitud_aceptada", "solicitud_id": message.get("solicitud_id"), "reciclador_id": user_id})
            elif message_type == "cancelar_solicitud":
                await manager.broadcast({"type": "solicitud_cancelada", "solicitud_id": message.get("solicitud_id"), "usuario_id": user_id})
            elif message_type == "completar_solicitud":
                await manager.broadcast({"type": "solicitud_completada", "solicitud_id": message.get("solicitud_id"), "reciclador_id": user_id})
            elif message_type == "ubicacion_reciclador":
                await manager.broadcast({
                    "type": "ubicacion_reciclador",
                    "lat": message.get("lat"),
                    "lng": message.get("lng"),
                    "solicitud_id": message.get("solicitud_id"),
                    "reciclador_id": user_id
                })
            elif message_type == "rechazar_solicitud":
                await manager.broadcast({"type": "solicitud_rechazada", "solicitud_id": message.get("solicitud_id")})

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"❌ Error en WebSocket: {e}")
        manager.disconnect(user_id)

# Incluir routers
app.include_router(routes_auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(routes.router, prefix="/api", tags=["Usuarios y Recursos"])
app.include_router(api_router)
app.include_router(realtime.router, prefix="/realtime", tags=["Real Time"])