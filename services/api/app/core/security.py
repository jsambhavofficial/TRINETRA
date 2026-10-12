"""
TRINETRA Security and Cryptographic Module.
Provides secure password hashing (PBKDF2-SHA256 with cryptographically random salt)
and standard HMAC-SHA256 signed tokens (JWT) without brittle external dependencies.
"""
import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import secrets
from typing import Any, Dict, Optional
from app.core.config import settings

PBKDF2_ITERATIONS = 100_000


def hash_password(plain_password: str) -> str:
    """Hashes a password using PBKDF2-SHA256 with a unique 16-byte random salt."""
    if not plain_password:
        raise ValueError("Password cannot be empty")
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS
    )
    salt_hex = salt.hex()
    key_hex = key.hex()
    return f"$pbkdf2-sha256${PBKDF2_ITERATIONS}${salt_hex}${key_hex}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored PBKDF2 hash using constant-time comparison."""
    if not plain_password or not hashed_password:
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) != 5 or parts[1] != "pbkdf2-sha256":
            return False
        iterations = int(parts[2])
        salt = bytes.fromhex(parts[3])
        expected_key = bytes.fromhex(parts[4])
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iterations
        )
        return hmac.compare_digest(expected_key, computed_key)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(payload_data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT-compatible token using HMAC-SHA256."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.AUTH_TOKEN_EXPIRE_MINUTES)

    claims = dict(payload_data)
    claims["iat"] = int(now.timestamp())
    claims["exp"] = int(expire.timestamp())

    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    claims_json = json.dumps(claims, separators=(",", ":"), sort_keys=True).encode("utf-8")

    header_b64 = _b64url_encode(header_json)
    claims_b64 = _b64url_encode(claims_json)

    signing_input = f"{header_b64}.{claims_b64}".encode("utf-8")
    secret_bytes = settings.AUTH_SECRET.encode("utf-8")
    signature = hmac.new(secret_bytes, signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{claims_b64}.{signature_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a signed JWT token. Raises ValueError on invalid or expired token."""
    if not token or not isinstance(token, str):
        raise ValueError("Invalid token format")

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Token must have 3 segments")

    header_b64, claims_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{claims_b64}".encode("utf-8")
    secret_bytes = settings.AUTH_SECRET.encode("utf-8")

    expected_signature = hmac.new(secret_bytes, signing_input, hashlib.sha256).digest()
    try:
        actual_signature = _b64url_decode(signature_b64)
    except Exception:
        raise ValueError("Malformed signature segment")

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise ValueError("Invalid token signature")

    try:
        claims_json = _b64url_decode(claims_b64).decode("utf-8")
        claims = json.loads(claims_json)
    except Exception:
        raise ValueError("Malformed token claims")

    exp = claims.get("exp")
    if exp is not None:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        if now_ts > exp:
            raise ValueError("Token has expired")

    return claims
