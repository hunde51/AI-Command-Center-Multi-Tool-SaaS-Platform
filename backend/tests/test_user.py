from app.models.role import UserRole


def test_user_role_enum_values() -> None:
    assert UserRole.USER.value == "USER"
    assert UserRole.ADMIN.value == "ADMIN"
