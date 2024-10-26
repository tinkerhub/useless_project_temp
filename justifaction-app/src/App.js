import React, { useState } from 'react';
import './App.css';
import justifications from './justifications';

function App() {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('work');
  const [justification, setJustification] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const generateJustification = () => {
    const justificationList = justifications[category];
    const randomIndex = Math.floor(Math.random() * justificationList.length);
    setJustification(justificationList[randomIndex]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateJustification();
  };

  return (
    <div className="App">
      <h1>JustiFiction</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Describe Your Situation:
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="e.g., I missed the meeting"
            required
          />
        </label>
        <label>
          Choose a Category:
          <select value={category} onChange={handleCategoryChange}>
            <option value="work">Work</option>
            <option value="social">Social</option>
            <option value="health">Health</option>
            <option value="personal">Personal</option>
          </select>
        </label>
        <button type="submit">Get Justification</button>
      </form>
      {justification && (
        <div className="justification">
          <h2>Your Justification:</h2>
          <p>{justification}</p>
        </div>
      )}
    </div>
  );
}

export default App;