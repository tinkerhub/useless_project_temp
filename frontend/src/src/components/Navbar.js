import { Component } from "react";
import "./NavbarStyles.css";
import { MenuItems } from "./MenuItems";
import { Link } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure Font Awesome is imported



class Navbar extends Component {
  state = { clicked: false };
  handleClick = () => {
    this.setState({ clicked: !this.state.clicked });
  };
  // Set state
  // Make Handleclick Function

  render() {
    return (
      <nav className="NavbarItems">
        <div class="navbar-logo-img">
</div>
        <h1 className="navbar-logo">AntiAlgo</h1>
        <ul className="nav-menu">
          {MenuItems.map((item, index) => {
            return (
              <li key={index}>
                <Link className={item.cName} to = {item.url}>
                  <i className={item.icon}></i>
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* <button1>Sign in </button1>
        <button2>Sign up </button2> */}
        
      </nav>
    );
  }
}

export default Navbar;
