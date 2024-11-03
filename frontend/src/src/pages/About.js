import React from "react";
import './About.css'; // Import your CSS file for styling
import { Link } from 'react-router-dom';
import FLL from '../assets/FLL.jpg'
import BT from '../assets/BT.jpg'
const About = () => {
  return (
    
    <div className="about-container">
        <Link to="/" className="back-arrow">
&larr; Back to Homepage
</Link>
      <div className="about-text">
        <div className="text-box">

        <h1>About The Project</h1>
        <p>
          Welcome to the innovative project, "The Anti-Algorithm"! The goal is to revolutionize the way you think about recommendations by introducing a fun and surprising twist. Instead of suggesting items you may like, we intentionally mismatch your preferences with recommendations that are completely unrelated. 
        </p>
        <p>
          Whether you're a fan of action movies or fantasy novels, we have something completely unexpected for you! The unique system is designed to provoke laughter and spark curiosity, making your exploration of new content an enjoyable experience.
        </p>
        <p>
          Join us on this quirky adventure and discover the unexpected. Who knows? You might find joy in the most unusual recommendations!
        </p>
      </div>
      </div>
      <div className="content-wrapper">
        <div className="about-image">
      
        <img src={FLL} alt="Left Side Image" className="about-image scale-effect" />
        <img src={BT} alt="Right Side Image" className="about-image scale-effect" />
      </div>
      </div>
      {/* <div className="about-image">
        <img src={FLL} alt="About Our Project" />
        <img src={MTV} alt="About Our Project" />
      </div> */}
    </div>
    
  );
};

export default About;
