import React, { useEffect, useState } from 'react';
import './Results.css';

const Results = () => {
  const [recommendations, setRecommendations] = useState({ movies: [], books: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Replace with your backend API URL
        const response = await fetch('https://antialgo-backend.onrender.com/');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <p style={{ color: 'white' }}>Loading recommendations...</p>;
  if (error) return <p style={{ color: 'white' }}>{error}</p>;

  return (
    <div className="results-page">
      <h1 style={{ color: 'white' }}>And.....Here are the Results !</h1>
      <div className='circular-container'>
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
   
