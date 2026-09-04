from .password_manager import save_password, verify_password


def create_password(sequence, email=None):
    if not sequence:
        return False

    save_password(sequence, email=email)
    return True


def authenticate(sequence, email=None):
    if not sequence:
        return False

    return verify_password(sequence, email=email)