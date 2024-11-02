"use client";

import React, { useState } from 'react';
import clsx from 'clsx'; // Import clsx
import './Home.css';
import Display from '@/openAI/display';

export default function Home() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [responseId, setResponseId] = useState(0); 
  const [responseType, setResponseType] = useState<'future' | 'past'>('past');
  const [showBox, setShowBox] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adMessage, setAdMessage] = useState('');

  function getRandomYear() {
    return Math.floor(Math.random() * (2100 - 1900 + 1)) + 1900;
  }
  const handleAd =()=>{
    setShowAd(true);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth', 
    });
    setTimeout(() => {
      setAdMessage("🎉🎉Congratulations..!🎉🎊");
    }, 13000);
  }

  const handleCheck = () => {
    setShowBox(true);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth', 
    });

    if (dateOfBirth && userName) {
      const currentYear = new Date().getFullYear();
      const deathYear = getRandomYear();
      const diffYear = currentYear - deathYear;

      setResponseId(Math.floor(Math.random() * 100) + 1);

      if (diffYear === 0) {
        setMessage(`Sorry ${userName}, you will die after 29 years!`);
      } else if (diffYear > 0) {
        setMessage(`Sorry ${userName}, you will die after ${diffYear} years!`);
        setResponseType('future'); 
        setShowButton(true);
        setAdTitle('To increase your life span upto 10 years click below button');
      } else {
        setMessage(`Sorry ${userName}, you died before ${Math.abs(diffYear)} years!`);
        setResponseType('past'); 
        setShowButton(true);
        setAdTitle('To reborn click below button');
      }
    } else {
      setMessage('Please enter your name and select your date of birth.');
      setResponseId(0);
      setShowButton(false);
      
    }
    setDateOfBirth('');
    setUserName('');
    setShowAd(false);
    setAdMessage('');
  };

  return (
    <>
      <div className='top relative flex flex-col items-center justify-center w-full'>
        <h1 className={clsx('text-center rubik-wet-paint-regular text-7xl md:text-6xl lg:text-9xl text-red-900 z-10', 'fade-in')}>The Death Finder</h1>
        <h3 className={clsx('text-center rubik-wet-paint-regular text-3xl md:text-4xl lg:text-5xl text-white z-10', 'fade-in')}>This app will help you to find out when is your death!</h3>
      </div>
      <div className="container flex flex-col items-center">
        <h2 className={clsx('text-white', 'fade-in')}>Select Your Date of Birth</h2>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={clsx("date-input", "input-fade-in")}
        />
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className={clsx("date-input", "input-fade-in")}
        />
        <button onClick={handleCheck} className={clsx("check-button", "button-fade-in")}>
          Check
        </button>
        {showAd ? (
          <video className="m-10 mb-11" autoPlay>
          <source src="/ad.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        ):
        (
        <>
        {showBox && (
          <div className={clsx('w-[90%] lg:w-[60%] bg-[#333333e5] flex-1 h-auto p-10 rounded-3xl mb-10 z-40', {
            'fade-in': message, 
            'slide-up': message
          })}>
            {message && <h3 className='text-white text-lg'>{message}</h3>}
            <Display id={responseId} type={responseType} />
          </div>
          
        )}
         {
         showButton && (
          <div className='flex justify-center items-center flex-col'>   
            <h4 className='text-center'>{adTitle}</h4>
            <button onClick={handleAd} className={clsx("check-button", "button-fade-in")}>
              click here
            </button>
          </div>
        )
         }
         </>)}
         {adMessage && (
          <div className={clsx('w-[90%] lg:w-[50%] bg-[#33333372] border-red-950 border-1 flex-1 rounded-3xl mb-8 z-40 bottom-0 absolute', {
            'fade-in': message, 
            'slide-up': message
          })}>
            {adMessage && <h3 className='text-red- text-3xl font-bold text-center'>{adMessage}</h3>}
          </div>
          
        )}
      </div>
    </>
  );
}
