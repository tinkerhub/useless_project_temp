import sqlite3

DATABASE = "passpose/backend/passpose.db"


def get_connection():
    return sqlite3.connect(DATABASE)


def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            sequence TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY,
            sequence TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()