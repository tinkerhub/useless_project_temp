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
    },
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
    },
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

for movie_data in movie_data_list:
    response = requests.post(url, json=movie_data)
    print(response.json())  # Print the response from the server