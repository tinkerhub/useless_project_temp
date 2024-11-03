import React from "react";
import './Hero.css';
function Hero({ pname, herpimg, title, text, btnClass }) {
  return (
    <div className={pname}>
      <img src={herpimg} alt={title} /> {/* Display the image */}
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

export default Hero;
