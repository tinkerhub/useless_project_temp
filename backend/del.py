import sqlite3

# Connect to your SQLite database
conn = sqlite3.connect('C:/Users/user/OneDrive/Desktop/Web Development/antialgo/useless_project/backend/recommendations.db')

# Create a cursor object
cursor = conn.cursor()

# Step 1: Identify duplicate entries based on specific columns
# Adjust the columns in the SELECT statement according to your requirements
cursor.execute("""
    SELECT movie_name, movie_genre, movie_img, movie_yor, movie_director, movie_cast
    FROM movies
    GROUP BY movie_name, movie_genre, movie_img, movie_yor, movie_director, movie_cast
    HAVING COUNT(*) > 1;
""")

duplicates = cursor.fetchall()

# Step 2: Delete duplicates while keeping one entry
for duplicate in duplicates:
    # Unpack all six fields returned by the query
    movie_name, movie_genre, movie_img, movie_yor, movie_director, movie_cast = duplicate
    cursor.execute("""
        DELETE FROM movies
        WHERE rowid NOT IN (
            SELECT MIN(rowid)
            FROM movies
            WHERE movie_name = ? AND movie_genre = ? AND movie_img = ? AND movie_yor = ? AND movie_director = ? AND movie_cast = ?
            GROUP BY movie_name, movie_genre, movie_img, movie_yor, movie_director, movie_cast
        );
    """, (movie_name, movie_genre, movie_img, movie_yor, movie_director, movie_cast))

# Commit the changes
conn.commit()

print("Duplicate rows deleted, retaining one entry for each.")

# Fetch and print the updated movie list to confirm deletion
print("\nUpdated Movies in Database:")
cursor.execute("SELECT * FROM movies;")
updated_rows = cursor.fetchall()
for row in updated_rows:
    print(row)

# Close the connection
conn.close()
