import sqlite3
from pathlib import Path


# Database file will be created inside the backend folder
DATABASE_PATH = Path(__file__).parent / "toothcheck.db"


def get_connection():
    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            whiteness_score REAL NOT NULL,
            shade TEXT,
            yellowing TEXT,
            staining TEXT,
            confidence REAL,
            delta_e REAL,
            lab_L REAL,
            lab_a REAL,
            lab_b REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


def save_scan(
    name,
    whiteness_score,
    shade,
    yellowing,
    staining,
    confidence,
    delta_e,
    lab_L,
    lab_a,
    lab_b,
):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO scans (
            name,
            whiteness_score,
            shade,
            yellowing,
            staining,
            confidence,
            delta_e,
            lab_L,
            lab_a,
            lab_b
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            whiteness_score,
            shade,
            yellowing,
            staining,
            confidence,
            delta_e,
            lab_L,
            lab_a,
            lab_b,
        ),
    )

    connection.commit()

    scan_id = cursor.lastrowid

    connection.close()

    return scan_id


def get_leaderboard():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            whiteness_score,
            created_at
        FROM scans
        ORDER BY whiteness_score DESC, created_at ASC
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "score": row["whiteness_score"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def get_scan(scan_id):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scans
        WHERE id = ?
        """,
        (scan_id,),
    )

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)