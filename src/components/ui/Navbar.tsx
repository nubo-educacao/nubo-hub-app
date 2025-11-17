import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <span className="navbar-logo">Nubo Hub</span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Início
        </NavLink>
        <NavLink to="/oportunidades">Oportunidades</NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
