import json
from .database import get_connection, initialize_database


def save_password(sequence, email=None):
    initialize_database()
    connection = get_connection()
    cursor = connection.cursor()

    sequence_json = json.dumps(sequence)

    if email:
        email_clean = email.strip().lower()
        cursor.execute(
            """
            INSERT INTO users (email, sequence)
            VALUES (?, ?)
            ON CONFLICT(email) DO UPDATE SET sequence = excluded.sequence
            """,
            (email_clean, sequence_json),
        )
    else:
        cursor.execute("DELETE FROM passwords")
        cursor.execute(
            "INSERT INTO passwords (id, sequence) VALUES (1, ?)",
            (sequence_json,),
        )

    connection.commit()
    connection.close()
    print(f"Password saved successfully for {email or 'default user'}!")
    return True


def load_password(email=None):
    initialize_database()
    connection = get_connection()
    cursor = connection.cursor()

    if email:
        email_clean = email.strip().lower()
        cursor.execute(
            "SELECT sequence FROM users WHERE email = ?",
            (email_clean,),
        )
    else:
        cursor.execute("SELECT sequence FROM passwords WHERE id = 1")

    row = cursor.fetchone()
    connection.close()

    if row is None:
        return None

    return json.loads(row[0])


def verify_password(sequence, email=None):
    saved_password = load_password(email)

    if saved_password is None:
        return False

    return sequence == saved_password