from fastapi import FastAPI, Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import SessionLocal, Movie, Book, MovieCreate, MovieResponse, BookCreate, BookResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define opposite genres mapping
genre_opposites = {
    "Action": "Romance",
    "Romance": "Sci-Fi",
    "Adventure": "Tragedy",
    "Tragedy": "Adventure",
    "Sci-fi": "Historical",
    "Historical": "Sci-fi",
    "Fantasy": "Tragedy",
    "Fiction" : "Non-Fiction",
    "Drama" : "Thriller"
    # Add more genres as needed
}
@app.get("/")
def read_root():
    return {"message": "API is live!"}

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.get("/movies/", response_model=list[MovieResponse])
def get_movies(db: Session = Depends(get_db)):
    movies = db.query(Movie).all()  # Fetch all movies from the database
    return movies

# Route to get all books
@app.get("/books/", response_model=list[BookResponse])
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).all()  # Fetch all books from the database
    return books
@app.post("/add_movie/", response_model=MovieResponse)
def add_movie(movie: MovieCreate, db: Session = Depends(get_db)):
    db_movie = Movie(
        movie_name=movie.movie_name,
        movie_genre=movie.movie_genre,
        movie_img=movie.movie_img,
        movie_yor=movie.movie_yor,
        movie_director=movie.movie_director,
        movie_cast=movie.movie_cast
    )
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie
@app.post("/add_book/", response_model=BookResponse)
def add_book(book: BookCreate, db: Session = Depends(get_db)):
    db_book = Book(
        book_name=book.book_name,
        book_genre=book.book_genre,
        book_img=book.book_img,
        book_yor=book.book_yor,
        book_author=book.book_author,
        book_publisher=book.book_publisher
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book
# Route to get recommendations based on favorite genres
# @app.post("/add_movie/", response_model=MovieResponse)
@app.post("/recommendation/")
def get_recommendation(favorite_genres: dict, db: Session = Depends(get_db)):
    # Validate that both "movie_genre" and "book_genre" keys are present in the request
    if "movie_genre" not in favorite_genres or "book_genre" not in favorite_genres:
        raise HTTPException(status_code=400, detail="Both 'movie_genre' and 'book_genre' are required.")
    # Get the favorite genres
    movie_genre = favorite_genres["movie_genre"]
    book_genre = favorite_genres["book_genre"]
    
    # Map favorite genres to their opposites
    opposite_movie_genre = genre_opposites.get(movie_genre)
    opposite_book_genre = genre_opposites.get(book_genre)

    print(f"Requested Movie Genre: {movie_genre}, Opposite Genre: {opposite_movie_genre}")
    print(f"Requested Book Genre: {book_genre}, Opposite Genre: {opposite_book_genre}")
    # Fetch recommendations based on the opposite genres
    opposite_movies = (
        db.query(Movie)
        .filter(Movie.movie_genre == opposite_movie_genre)
        .all() if opposite_movie_genre else []
    )
    opposite_books = (
        db.query(Book)
        .filter(Book.book_genre == opposite_book_genre)
        .all() if opposite_book_genre else []
    )
    # More debugging outputs
    print(f"Found Movies: {[movie.movie_name for movie in opposite_movies]} (Genre: {opposite_movie_genre})")
    print(f"Found Books: {[book.book_name for book in opposite_books]} (Genre: {opposite_book_genre})")
    return {
        "movies": [
            {
                "movie_name": movie.movie_name,
                "movie_img": movie.movie_img,
                "movie_yor": movie.movie_yor,
                "movie_director": movie.movie_director,
                "movie_cast": movie.movie_cast,
            } for movie in opposite_movies
        ],
        "books": [
            {
                "book_name": book.book_name,
                "book_img": book.book_img,
                "book_yor": book.book_yor,
                "book_author": book.book_author,
                "book_publisher": book.book_publisher,
            } for book in opposite_books
        ],
    }
