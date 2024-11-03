# import sqlite3

# # Connect to the existing database
# conn = sqlite3.connect('recommendations.db')
# cursor = conn.cursor()

# # Add new columns if they don't already exist
# cursor.execute('ALTER TABLE recommendations ADD COLUMN movie_genre TEXT')
# cursor.execute('ALTER TABLE recommendations ADD COLUMN book_genre TEXT')

# # Example values to inject
# example_data = [
#     ("Inception", "1984", "Sci-Fi", "Dystopian"),
#     ("The Matrix", "Brave New World", "Sci-Fi", "Dystopian"),
#     ("Interstellar", "Fahrenheit 451", "Sci-Fi", "Dystopian"),
# ]

# # Insert example values into the recommendations table
# cursor.executemany('''
#     INSERT INTO recommendations (Titanic, , movie_genre, book_genre)
#     VALUES (?, ?, ?, ?)
# ''', example_data)

# # Commit the changes and close the connection
# conn.commit()
# conn.close()

# print("Database updated and example data inserted successfully.")
