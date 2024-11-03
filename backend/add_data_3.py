import requests
# Adding movies
url_movies = "http://127.0.0.1:8000/add_movie/"
movie_data = [
    {
        "movie_name": "Se7en",
        "movie_genre": "Thriller",
        "movie_img": "https://th.bing.com/th/id/OIP.DftdC9cMrip5Ld6bdAS0NwHaK0?w=184&h=270&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 1995,
        "movie_director": "David Fincher",
        "movie_cast": "Brad Pitt, Morgan Freeman"
    },
    {
        "movie_name": "Gone Girl",
        "movie_genre": "Thriller",
        "movie_img": "https://th.bing.com/th/id/OIP.GnLXsThqm-3Xvyj7mKqkrgHaFj?w=202&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2014,
        "movie_director": "David Fincher",
        "movie_cast": "Ben Affleck, Rosamund Pike"
   },
   {
       "movie_name": "Shutter Island",
       "movie_genre": "Thriller",
       "movie_img": "https://th.bing.com/th/id/OIP.dbwuhFb2ByKdlEbP3sN6BwHaLH?w=133&h=200&c=7&r=0&o=5&dpr=1.4&pid=1.7",
       "movie_yor": 2010,
       "movie_director": "Martin Scorsese",
       "movie_cast": "Leonardo DiCaprio, Emily Mortimer"
       
   },
    {
        "movie_name": "The Imitation Game",
        "movie_genre": "Historical",
        "movie_img": "https://th.bing.com/th/id/OIP.4PG50sCbQlEqR75Ps1CixwHaEK?w=184&h=103&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2014,
        "movie_director": "Morten Tyldum",
        "movie_cast": "Benedict Cumberbatch, Keira Knightley"
    },
    {
        "movie_name": "12 Angry Men",
        "movie_genre": "Drama",
        "movie_img": "https://th.bing.com/th/id/OIP.OA_NGlnR_SbZIF8f2Q8NaAHaLH?w=115&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 1957,
        "movie_director": "Sidney Lumet",
        "movie_cast": "Henry Fonda, Lee J. Cobb"
    },
    {
        "movie_name": "Prisoners",
        "movie_genre": "Thriller",
        "movie_img": "https://th.bing.com/th/id/OIP.-M2sF-zUBtIKGblE2AFvMwHaLH?w=115&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2013,
        "movie_director": "Denis Villeneuve",
        "movie_cast": "Hugh Jackman, Jake Gyllenhaal"
   },
    {
        "movie_name": "Mad Max: Fury Road",
        "movie_genre": "Action",
        "movie_img": "https://th.bing.com/th/id/OIP.PE99qDCmpsncFOMR2ijoVAHaLH?w=184&h=276&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2015,
        "movie_director": "George Miller",
        "movie_cast": "Tom Hardy, Charlize Theron"
    },
    {
        "movie_name": "Captain America: The First Avenger",
        "movie_genre": "Action",
        "movie_img": "https://th.bing.com/th/id/OIP.G5E3SMT1T2xxyp1ldV2igAHaLH?w=184&h=276&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2011,
        "movie_director": "Joe Johnston",
        "movie_cast": "Chris Evans, Hayley Atwell"
    },
    {
        "movie_name": "Spider-Man: Homecoming",
        "movie_genre": "Action",
        "movie_img": "https://th.bing.com/th/id/OIP.Z3axJfFYTYQoagBw6j648QHaLP?w=184&h=281&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 2017,
        "movie_director": "Jon Watts",
        "movie_cast": "Tom Holland, Michael Keaton"
    }
]

for movie_data in movie_data:
    response = requests.post(url_movies, json=movie_data)
    print(response.json())  # Print the response from the server

# Adding books
url_books = "http://127.0.0.1:8000/add_book/"
book_data = [
    {
        "book_name": "Sapiens: A Brief History of Humankind",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th?id=OSK.dhiUvxV0HSOl_DM0o51CZ0XE_-_-9rQ70XO4-qPiMKQ&w=102&h=102&c=7&o=6&dpr=1.4&pid=SANGAM",
        "book_yor": 2011,
        "book_author": "Yuval Noah Harari",
        "book_publisher": "Harvill Secker"
    },
    {
        "book_name": "Atomic Habits",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th?id=OIP.00ByyHZv2R3JrR5orWROpwHaD4&w=110&h=110&c=7&rs=1&qlt=80&pcl=f9f9f9&o=6&cdv=1&dpr=1.4&pid=18.2",
        "book_yor": 2018,
        "book_author": "James Clear",
        "book_publisher": "Avery"
    },
    {
        "book_name": "The Yoga Sutras of Patanjali",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.5IrL0qXK8v4t-UEeJYCsqAHaLL?w=184&h=278&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 400,
        "book_author": "Patanjali",
        "book_publisher": "N/A"
    },
    {
        "book_name": "The Tax and Legal Playbook",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.mNpO8JxaTz2cHT76fvdJmAHaLJ?w=117&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 2018,
        "book_author": "Mark J. Kohler",
        "book_publisher": "Kohler Tax and Legal"
    },
    {
        "book_name": "Journey to the Center of the Earth",
        "book_genre": "Adventure",
        "book_img": "https://th.bing.com/th/id/OIP.mNpO8JxaTz2cHT76fvdJmAHaLJ?w=117&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1864,
        "book_author": "Jules Verne",
        "book_publisher": "Pierre-Jules Hetzel"
    
    },
    {
        "book_name": "Into the Wild",
        "book_genre": "Adventure",
        "book_img": "https://th.bing.com/th/id/OIP.980vpTWK41OEIYU0XP3KIAHaMB?w=184&h=299&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1996,
        "book_author": "Jon Krakauer",
        "book_publisher": "Villard"
    },
    {
        "book_name": "The Godfather",
        "book_genre": "Thriller",
        "book_img": "https://th.bing.com/th/id/OIP.UjfdB0gitxsUEZWSSD_IbgHaLW?w=184&h=283&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1969,
        "book_author": "Mario Puzo",
        "book_publisher": "G.P. Putnam's Sons"
    },
    {
        "book_name": "The Monk Who Sold His Ferrari",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.MZGJgitBBXTz0-YLkeoBXQHaLi?w=184&h=286&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1997,
        "book_author": "Robin Sharma",
        "book_publisher": "HarperCollins"
    },
    {
        "book_name": "The Right Stuff",
        "book_genre": "Non-Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.BXZuS1RlZ01sPoFQ9KhUxAHaLn?w=115&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1979,
        "book_author": "Tom Wolfe",
        "book_publisher": "Farrar, Straus and Giroux"
    },
    {
        "book_name": "A Brief History of Time",
        "book_genre": "Non-Fiction",
        "book_img": "https://www.rd.com/wp-content/uploads/2021/03/a-breif-history-of-time-book-via-amazon.com-ecomm.jpg?w=700",
        "book_yor": 1988,
        "book_author": "Stephen Hawking",
        "book_publisher": "Bantam Books"
    },
    {
        "book_name": "The Sea Around Us",
        "book_genre": "Non-Fiction",
        "book_img": "https://www.rd.com/wp-content/uploads/2021/03/the-sea-around-us-book-via-amazon.com-ecomm.jpg?fit=700,700",
        "book_yor": 1951,
        "book_author": "Rachel Carson",
        "book_publisher": "Oxford University Press"
    }
]



for book_data in book_data:
    response = requests.post(url_books, json=book_data)
    print(response.json())  # Print the response from the server
