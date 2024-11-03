import React from 'react';
import { useLocation } from 'react-router-dom';
import './Results.css';

const Results = () => {
  const location = useLocation();
  const recommendations = location.state?.recommendations || { movies: [], books: [] };

  return (
    <div className="results-page">
      <h1 style={{ color: 'white' }}>And.....Here are the Results !</h1>
      <div className="circular-container">
        <div className="recommendations">
          <h2 style={{ color: 'white' }}>Recommended Movies</h2>
          <div className="recommended-items">
            {recommendations.movies.length > 0 ? (
              recommendations.movies.map((movie, index) => (
                <div className="item" key={index}>
                  <img src={movie.movie_img || '../assets/default-movie.jpg'} alt={movie.movie_name} />
                  <p><strong>Title :</strong> {movie.movie_name}</p>
                  <p><strong>Director :</strong> {movie.movie_director}</p>
                  <p><strong>Cast :</strong> {movie.movie_cast}</p>
                  <p><strong>Year of Release :</strong> {movie.movie_yor}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'white' }}>No movie recommendations found.</p>
            )}
          </div>

          <h2 style={{ color: 'white' }}>Recommended Books</h2>
          <div className="recommended-items">
            {recommendations.books.length > 0 ? (
              recommendations.books.map((book, index) => (
                <div className="item" key={index}>
                  <img src={book.book_img || '../assets/default-book.jpg'} alt={book.book_name} />
                  <p><strong>Title :</strong> {book.book_name}</p>
                  <p><strong>Author :</strong> {book.book_author}</p>
                  <p><strong>Publisher :</strong> {book.book_publisher}</p>
                  <p><strong>Year of Release :</strong> {book.book_yor}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'white' }}>No book recommendations found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
