import time
import json
import random
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.models.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import Usuario 

# Importaciones de rutas
from app.api.v1 import routes, routes_auth
from app.api.v1.routes import router as api_router
from app.services import realtime

# --- DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="ReciApp API")

# --- CORS FLEXIBLE (Desarrollo) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKETS ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ Cliente conectado: {user_id}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ Cliente desconectado: {user_id}")

    async def broadcast(self, message: dict):
        for _, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    max_retries = 30
    for _ in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Tablas creadas exitosamente")
            break
        except Exception:
            time.sleep(2)

# --- ENDPOINTS ---

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

# 🤖 INTELIGENCIA DE MERCADO: Precios Dinámicos
@app.get("/api/precios")
def get_precios_ai():
    """
    Simula una IA analizando el mercado internacional de commodities
    para ajustar los precios de ReciYAP en tiempo real.
    """
    materiales = [
        {"material": "Papel Blanco", "base": 0.85},
        {"material": "Plástico PET", "base": 1.20},
        {"material": "Cartón", "base": 0.55},
        {"material": "Chatarra", "base": 1.10},
        {"material": "Vidrio", "base": 0.30},
    ]
    
    response = []
    for item in materiales:
        # La IA calcula una variación aleatoria de +/- 5%
        variacion = random.uniform(-0.05, 0.05)
        nuevo_precio = round(item["base"] * (1 + variacion), 2)
        
        # Lógica de tendencia
        if variacion > 0.01:
            tendencia = "up"
        elif variacion < -0.01:
            tendencia = "down"
        else:
            tendencia = "stable"
        
        response.append({
            "material": item["material"],
            "precio": nuevo_precio,
            "variacion": f"{variacion:+.2%}",
            "tendencia": tendencia
        })
    return response

# ✅ ADMIN: lista usuarios por rol
@app.get("/api/admin/usuarios", tags=["Admin"])
def obtener_usuarios(rol: str, db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).filter(Usuario.rol == rol).all()
    return [
        {"id": u.id, "nombre": u.nombre, "correo": u.correo, "rol": u.rol}
        for u in usuarios
    ]

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Routers existentes
app.include_router(routes_auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(routes.router, prefix="/api", tags=["Usuarios y Recursos"])
app.include_router(api_router)
app.include_router(realtime.router, prefix="/realtime", tags=["Real Time"])