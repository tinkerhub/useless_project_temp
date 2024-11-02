import Loader from '@/Screen/Loader'
import React from 'react'
import './globals.css'

function page() {
  return (
    <div >
    {/*    <video autoPlay loop muted className="backgroundVideo">
          <source src="/smoke.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
    */}
      <Loader/>
    </div>
  )
}

export default page