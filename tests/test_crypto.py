"""Tests for the encryption module."""

from achilles.crypto import decrypt, encrypt, generate_api_key


def test_encrypt_decrypt_roundtrip():
    master_key = "test-master-key-for-testing"
    plaintext = "sk-1234567890abcdef"

    encrypted = encrypt(plaintext, master_key)
    assert encrypted != plaintext

    decrypted = decrypt(encrypted, master_key)
    assert decrypted == plaintext


def test_encrypt_produces_different_ciphertext():
    """Each encryption should produce unique ciphertext (random salt/nonce)."""
    master_key = "test-key"
    plaintext = "same-value"

    c1 = encrypt(plaintext, master_key)
    c2 = encrypt(plaintext, master_key)
    assert c1 != c2


def test_wrong_key_fails():
    master_key = "correct-key"
    wrong_key = "wrong-key"
    plaintext = "secret-value"

    encrypted = encrypt(plaintext, master_key)

    try:
        decrypt(encrypted, wrong_key)
        assert False, "Should have raised an exception"
    except Exception:
        pass


def test_generate_api_key():
    key = generate_api_key()
    assert key.startswith("av_")
    assert len(key) > 10

    key2 = generate_api_key()
    assert key != key2
