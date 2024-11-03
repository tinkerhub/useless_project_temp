// import HS from "./HS";
import Navbar from "../components/Navbar";
import img1 from "../assets/pxfuel.jpg"
import Hero from "../components/Hero";
// import ImageSlider from "../components/Layout/ImageSlider";

function Homepage() {
  return (
    <>
      <Navbar />
      <Hero
        pname="hero-mid"
        herpimg={img1} // Use the external image URL
        // title="About"
        // text="Choose your place"
        btnClass="hide"
      />
    </>
  );
}
export default Homepage;