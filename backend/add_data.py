import requests

# Adding a movie
url = "http://127.0.0.1:8000/add_movie/"
movie_data_list = [
    {
        "movie_name": "The Matrix",
        "movie_genre": "Sci-Fi",
        "movie_img": "https://www.bing.com/th?id=OIP.qLl9vlfF2T5vOWKcNo2x0QAAAA&w=155&h=200&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2",
        "movie_yor": 1999,
        "movie_director": "Lana Wachowski, Lilly Wachowski",
        "movie_cast": "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss"
    },
    {
        "movie_name": "Parasite",
        "movie_genre": "Thriller",
        "movie_img": "https://www.bing.com/th?id=OIP.33dVIOkDQh7HkVK8SkRXXQHaDt&w=314&h=200&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2",
        "movie_yor": 2019,
        "movie_director": "Bong Joon-ho",
        "movie_cast": "Kang-ho Song, Lee Sun-kyun, Cho Yeo-jeong"
    },
    {
        "movie_name": "The Shawshank Redemption",
        "movie_genre": "Drama",
        "movie_img": "https://www.bing.com/th?id=OIP.yobjBRMMdekQvZwGHeebKgHaLH&w=155&h=200&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2",
        "movie_yor": 1994,
        "movie_director": "Frank Darabont",
        "movie_cast": "Tim Robbins, Morgan Freeman"
    },
    {
        "movie_name": "Titanic",
        "movie_genre": "Romance",
        "movie_img": "https://th.bing.com/th?id=OSK.6buUBXOYTxsrYW7s8SKGe6_ftOIOYXjvtQoMC-7xrbE&w=46&h=46&c=11&rs=1&qlt=80&o=6&dpr=1.5&pid=SANGAM",
        "movie_yor": 1997,
        "movie_director": "James Cameron",
        "movie_cast": "Leonardo DiCaprio, Kate Winslet"
    },
    {
        "movie_name": "Interstellar",
        "movie_genre": "Sci-Fi",
        "movie_img": "https://www.bing.com/th?id=OIP.eLWYJWQG-JkUSQCDCv0WOgHaLH&w=155&h=200&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2",
        "movie_yor": 2014,
        "movie_director": "Christopher Nolan",
        "movie_cast": "Matthew McConaughey, Anne Hathaway"
    }
]

for movie_data in movie_data_list:
    response = requests.post(url, json=movie_data)
    print(response.json())  # Print the response from the server

# Adding a book
url = "http://127.0.0.1:8000/add_book/"
book_data_list = [
    {
        "book_name": "1984",
        "book_genre": "Dystopian",
        "book_img": "https://www.bing.com/th?id=OIP.RZN_xK5aXZdm-Ek6-SASaAHaKe&w=146&h=206&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2",
        "book_yor": 1949,
        "book_author": "George Orwell",
        "book_publisher": "Secker & Warburg"
    },
    {
        "book_name": "To Kill a Mockingbird",
        "book_genre": "Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.Ki_BR3KdIyKfhEwVmzVhGgHaLE?w=192&h=287&c=7&r=0&o=5&pid=1.7",
        "book_yor": 1960,
        "book_author": "Harper Lee",
        "book_publisher": "J.B. Lippincott & Co."
    },
    {
        "book_name": "Pride and Prejudice",
        "book_genre": "Romance",
        "book_img": "https://th.bing.com/th/id/OIP.wcZjPkH4FZD5QYi_2kfxxAHaLS?w=194&h=296&c=7&r=0&o=5&dpr=1.1&pid=1.7",
        "book_yor": 1813,
        "book_author": "Jane Austen",
        "book_publisher": "T. Egerton"
    },
    {
        "book_name": "The Catcher in the Rye",
        "book_genre": "Fiction",
        "book_img": "https://th.bing.com/th/id/OIP.EhOg_5HJS4hDMONihBcEoQHaMP?w=194&h=321&c=7&r=0&o=5&dpr=1.1&pid=1.7",
        "book_yor": 1951,
        "book_author": "J.D. Salinger",
        "book_publisher": "Little, Brown and Company"
    },
    {
        "book_name": "The Hobbit",
        "book_genre": "Fantasy",
        "book_img": "https://th.bing.com/th/id/OIP.QOnKLd2Kp4hsI1oadOUh0AHaLi?w=194&h=302&c=7&r=0&o=5&dpr=1.1&pid=1.7",
        "book_yor": 1937,
        "book_author": "J.R.R. Tolkien",
        "book_publisher": "George Allen & Unwin"
    }
]

for book_data in book_data_list:
    response = requests.post(url, json=book_data)
    print(response.json())  # Print the response from the server
