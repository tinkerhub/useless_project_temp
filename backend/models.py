from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Movie(Base):
    __tablename__ = 'movies'
    
    movie_id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # Set auto-increment
    movie_name = Column(String, index=True)
    movie_genre = Column(String)
    movie_img = Column(String)  # Storing image path/URL
    movie_yor = Column(Integer)  # Year of release
    movie_director = Column(String)
    movie_cast = Column(String)  # List of actors

class Book(Base):
    __tablename__ = 'books'
    
    book_id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # Set auto-increment
    book_name = Column(String, index=True)
    book_genre = Column(String)
    book_img = Column(String)  # Storing image path/URL
    book_yor = Column(Integer)  # Year of release
    book_author = Column(String)
    book_publisher = Column(String)

# Pydantic Models
class MovieCreate(BaseModel):
    movie_name: str
    movie_genre: str
    movie_img: str
    movie_yor: int
    movie_director: str
    movie_cast: str

class MovieResponse(BaseModel):
    movie_id: int
    movie_name: str
    movie_genre: str
    movie_img: str
    movie_yor: int
    movie_director: str
    movie_cast: str

    class Config:
        orm_mode = True

class BookCreate(BaseModel):
    book_name: str
    book_genre: str
    book_img: str
    book_yor: int
    book_author: str
    book_publisher: str

class BookResponse(BaseModel):
    book_id: int
    book_name: str
    book_genre: str
    book_img: str
    book_yor: int
    book_author: str
    book_publisher: str

    class Config:
        orm_mode = True

# Database connection
DATABASE_URL = "sqlite:///recommendations.db"
engine = create_engine(DATABASE_URL)

# Create the tables in the database
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
