import requests

# Adding movies
url_movies = "http://127.0.0.1:8000/add_movie/"
movie_data = [
    {
        "movie_name": "Romeo + Juliet",
        "movie_genre": "Tragedy",
        "movie_img": "https://th.bing.com/th/id/OIP.FB5WZ1zkJdyR95alt3wd8QHaE9?w=257&h=180&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 1996,
        "movie_director": "Baz Luhrmann",
        "movie_cast": "Leonardo DiCaprio, Claire Danes"
    },
    {
        "movie_name": "The Pursuit of Happyness",
        "movie_genre": "Tragedy",
        "movie_img": "https://static1.srcdn.com/wordpress/wp-content/uploads/2024/03/the-pursuit-of-happyness-movie-poster-showing-will-smith-and-jaden-smith-holding-hands-with-a-skyline-in-the-background.jpeg",
        "movie_yor": 2006,
        "movie_director": "Gabriele Muccino",
        "movie_cast": "Will Smith, Jaden Smith"
    },
    {
        "movie_name": "Schindler's List",
        "movie_genre": "Historical",
        "movie_img": "https://www.bing.com/th?id=OIP.Ww_vRHlqpXXzor5fSafd7QHaLH&w=155&h=200&c=8&rs=1&qlt=90&o=6&dpr=1.4&pid=3.1&rm=2",
        "movie_yor": 1993,
        "movie_director": "Steven Spielberg",
        "movie_cast": "Liam Neeson, Ben Kingsley"
    },
    {
        "movie_name": "The Lord of the Rings: The Fellowship of the Ring",
        "movie_genre": "Fantasy",
        "movie_img": "https://th.bing.com/th?id=OSK.uJZ6ReD05-vgFDf6XxV88I-paQXlRlKFYjQ-FHn4pHY&w=46&h=46&c=11&rs=1&qlt=80&o=6&dpr=1.4&pid=SANGAM",
        "movie_yor": 2001,
        "movie_director": "Peter Jackson",
        "movie_cast": "Elijah Wood, Ian McKellen"
    },
    {
        "movie_name": "Indiana Jones: Raiders of the Lost Ark",
        "movie_genre": "Adventure",
        "movie_img": "https://th.bing.com/th/id/OIP.E9jXLk9lWG43LnNTVgduiQHaKZ?w=184&h=259&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "movie_yor": 1981,
        "movie_director": "Steven Spielberg",
        "movie_cast": "Harrison Ford, Karen Allen"
    }
]

for movie_data in movie_data:
    response = requests.post(url_movies, json=movie_data)
    print(response.json())  # Print the response from the server

# Adding books
url_books = "http://127.0.0.1:8000/add_book/"
book_data = [
    {
        "book_name": "Hamlet",
        "book_genre": "Tragedy",
        "book_img": "https://th.bing.com/th/id/OIP.U7nnjZ2Ei3FWQdm_1jAMmAHaLV?w=184&h=281&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1603,
        "book_author": "William Shakespeare",
        "book_publisher": "N/A"
    },
    {
        "book_name": "The Book Thief",
        "book_genre": "Historical",
        "book_img": "https://th.bing.com/th/id/OIP.YjcEFIps2gWWd0trU11HmwHaLj?w=184&h=287&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 2005,
        "book_author": "Markus Zusak",
        "book_publisher": "Knopf"
    },
    {
        "book_name": "Treasure Island",
        "book_genre": "Adventure",
        "book_img": "https://th.bing.com/th/id/OIP.MjZhmO7DW2xLafSUnxc90AHaLb?w=184&h=284&c=7&r=0&o=5&dpr=1.4&pid=1.7",
        "book_yor": 1883,
        "book_author": "Robert Louis Stevenson",
        "book_publisher": "Cassell"
    }
]

for book_data in book_data:
    response = requests.post(url_books, json=book_data)
    print(response.json())  # Print the response from the server
