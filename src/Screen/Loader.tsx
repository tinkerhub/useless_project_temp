"use client";

import { useEffect, useState } from 'react';
import Home from './Home';
import Image from 'next/image';
import './Loader.css';

export default function Loader() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowApp(true);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (showApp) {
    return <Home />;
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen overflow-hidden bg-black flex-col">

        <Image src="/favicon.png" className='effect' alt="" width={100} height={100} />
        <h1 className="text-white z-10 text-xl font-semibold">Please Wait....</h1>
      </div>
 
  );
}
