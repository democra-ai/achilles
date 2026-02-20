"""AES-256-GCM encryption for secret storage.

Implements the encryption pattern from managing-secrets skill:
- AES-256-GCM authenticated encryption
- Scrypt-based key derivation
- Per-secret random salt and IV
- Zero-knowledge: master key never stored
"""

import base64
import os
import struct
import time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt


SALT_LENGTH = 32
NONCE_LENGTH = 12  # 96-bit nonce for AES-GCM
KEY_LENGTH = 32  # 256-bit key


def _derive_key(master_key: str, salt: bytes) -> bytes:
    """Derive encryption key from master key using scrypt."""
    kdf = Scrypt(salt=salt, length=KEY_LENGTH, n=2**14, r=8, p=1)
    return kdf.derive(master_key.encode("utf-8"))


def encrypt(plaintext: str, master_key: str) -> str:
    """Encrypt plaintext with AES-256-GCM.

    Format: base64(salt || nonce || timestamp || ciphertext)
    - salt: 32 bytes (for key derivation)
    - nonce: 12 bytes (AES-GCM IV)
    - timestamp: 8 bytes (encryption time, big-endian uint64)
    - ciphertext: variable (includes 16-byte auth tag)
    """
    salt = os.urandom(SALT_LENGTH)
    nonce = os.urandom(NONCE_LENGTH)
    key = _derive_key(master_key, salt)

    timestamp = struct.pack(">Q", int(time.time()))

    aesgcm = AESGCM(key)
    # Use timestamp as additional authenticated data
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), timestamp)

    combined = salt + nonce + timestamp + ciphertext
    return base64.b64encode(combined).decode("ascii")


def decrypt(encrypted: str, master_key: str) -> str:
    """Decrypt AES-256-GCM encrypted data."""
    combined = base64.b64decode(encrypted)

    salt = combined[:SALT_LENGTH]
    nonce = combined[SALT_LENGTH : SALT_LENGTH + NONCE_LENGTH]
    timestamp = combined[SALT_LENGTH + NONCE_LENGTH : SALT_LENGTH + NONCE_LENGTH + 8]
    ciphertext = combined[SALT_LENGTH + NONCE_LENGTH + 8 :]

    key = _derive_key(master_key, salt)

    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, timestamp)
    return plaintext.decode("utf-8")


def generate_api_key() -> str:
    """Generate a secure API key with 'av_' prefix."""
    return f"av_{base64.urlsafe_b64encode(os.urandom(32)).decode('ascii').rstrip('=')}"
