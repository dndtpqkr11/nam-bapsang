import hashlib
import hmac
import base64
import json
import time
from typing import Dict, Any, Optional

SECRET_KEY = "nambapsang_super_secret_jwt_key_2026"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """SHA-256 + Salt 비밀번호 해싱"""
    salt = "bapsang_salt_15m"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: Dict[str, Any], expires_delta_sec: int = 86400) -> str:
    """JWT Access Token 생성 (Standard Base64URL + HMAC-SHA256)"""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_delta_sec

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

    signature_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """JWT Access Token 검증 및 디코딩"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts

        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        
        # Add padding back for base64 decode
        rem = len(signature_b64) % 4
        if rem > 0:
            signature_b64 += "=" * (4 - rem)
        actual_sig = base64.urlsafe_b64decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())

        if payload.get("exp", 0) < time.time():
            return None # Expired

        return payload
    except Exception:
        return None
