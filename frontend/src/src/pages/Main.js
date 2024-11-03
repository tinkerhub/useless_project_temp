import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Main.css";

function Main() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState({ movies: "", books: "" });
  const [recommendation, setRecommendation] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFavorites((prevFavorites) => ({
      ...prevFavorites,
      [name]: value,
    }));
  };

  const getRecommendation = async () => {
    const response = await fetch("http://127.0.0.1:8000/recommendation/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        movie_genre: favorites.movies,
        book_genre: favorites.books,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      navigate("/results", { state: { recommendations: data } });
    } else {
      console.error("Error fetching recommendations:", response.statusText);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="main-page">
        
      <header className="hero">
        <div className={`slide-in ${isVisible ? "visible" : ""}`}>
          <h1>Welcome to The Anti-Algorithm !!!</h1>
          <p>Your reverse recommendation experience !</p>
        </div>
      </header>
      <div className="input-section">
        <h2>Enter Your Favourite Genres</h2>
        <input
          type="text"
          name="movies"
          placeholder="Favourite Movie Genre"
          value={favorites.movies}
          onChange={handleChange}
          className="input-field"
        />
        <input
          type="text"
          name="books"
          placeholder="Favourite Book Genre"
          value={favorites.books}
          onChange={handleChange}
          className="input-field"
        />
        <button onClick={getRecommendation} className="btn-surprise">
            
          Surprise Me!
        </button>
      </div>
      {recommendation && (
        <div className="result-section">
          <h3>Your Surprise Recommendations:</h3>
          <p><strong>Movies:</strong> {recommendation.movies}</p>
          <p><strong>Books:</strong> {recommendation.books}</p>
        </div>
      )}
      {/* <footer>
        <Link to="/about" className="footer-link">Learn More About This Project</Link>
      </footer> */}
    </div>
  );
}

export default Main;
