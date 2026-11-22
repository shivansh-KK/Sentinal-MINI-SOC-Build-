import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SENTINEL SOC"
    PROJECT_VERSION: str = "1.0.0"
    TAGLINE: str = "Detect. Investigate. Respond. Protect."
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentinel-super-secret-jwt-key-2026-secure-capstone-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Default SQLite for standalone portability, Postgres supported)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel_soc.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Response Engine Settings
    DEFAULT_RESPONSE_MODE: str = os.getenv("DEFAULT_RESPONSE_MODE", "simulation")  # simulation, approval_required, lab_enforcement
    LAB_ALLOWED_CIDRS: List[str] = [
        "192.168.0.0/16",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "127.0.0.1/32"
    ]
    PROTECTED_IPS: List[str] = [
        "127.0.0.1",
        "0.0.0.0",
        "255.255.255.255"
    ]
    
    # Wazuh External Connector
    WAZUH_ENABLED: bool = False
    WAZUH_API_URL: str = os.getenv("WAZUH_API_URL", "https://192.168.1.100:55000")
    WAZUH_USER: str = os.getenv("WAZUH_USER", "wazuh")
    WAZUH_PASSWORD: str = os.getenv("WAZUH_PASSWORD", "")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
