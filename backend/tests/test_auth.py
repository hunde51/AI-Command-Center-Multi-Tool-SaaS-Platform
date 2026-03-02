from app.core.hashing import hash_password, verify_password


def test_password_hash_and_verify() -> None:
    plain = "StrongPass123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed)
    assert not verify_password("wrong-pass", hashed)
