import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const ROLE_HOME = {
  student: '/profile',
  parent:  '/parent-dashboard',
  teacher: '/teacher-dashboard',
};

const WORKSPACE_PATHS = [
  '/teacher-dashboard',
  '/profile',
  '/parent-dashboard',
];

const Navbar = () => {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [showDrop, setShowDrop]         = useState(false);
  const [scrolled, setScrolled]         = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const isWorkspace = WORKSPACE_PATHS.includes(location.pathname);
  const isHome      = location.pathname === '/';

  // hide entirely on workspace dashboards (they have their own navbars)
  if (isWorkspace) return null;

  const profilePath = ROLE_HOME[user?.role] || '/profile';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => { setMenuOpen(false); setShowDrop(false); };

  const handleLogout = () => { logout(); navigate('/'); close(); };

  return (
    <nav className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''} ${isHome ? 'site-nav--home' : ''}`}>
      <div className="site-nav__inner">

        {/* Logo */}
        <Link to="/" className="site-nav__logo" onClick={close}>
          <img src={logo} alt="CoachEdu" className="site-nav__logo-img" />
          <span className="site-nav__brand">
            CoachEdu <span>Institute</span>
          </span>
        </Link>

        {/* Links */}
        <div className={`site-nav__links ${menuOpen ? 'site-nav__links--open' : ''}`}>
          {[
            { to: '/',        label: 'Home'    },
            { to: '/about',   label: 'About'   },
            { to: '/courses', label: 'Courses' },
            { to: '/faculty', label: 'Faculty' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`site-nav__link ${location.pathname === to ? 'site-nav__link--active' : ''}`}
              onClick={close}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              <Link to={profilePath} className="site-nav__cta" onClick={close}>
                {user.role === 'teacher' ? 'Dashboard' : 'My Profile'}
              </Link>
              <button className="site-nav__logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="site-nav__drop-wrap">
              <button
                className="site-nav__cta"
                onClick={() => setShowDrop(p => !p)}
                aria-expanded={showDrop}
              >
                Login
                <i className="fas fa-chevron-down site-nav__caret"></i>
              </button>

              {showDrop && (
                <div className="site-nav__dropdown">
                  {['student', 'parent', 'teacher'].map(role => (
                    <button
                      key={role}
                      className="site-nav__drop-item"
                      onClick={() => { navigate(`/login?role=${role}`); close(); }}
                    >
                      <i className={`fas ${role === 'student' ? 'fa-user-graduate' : role === 'parent' ? 'fa-user' : 'fa-chalkboard-teacher'} site-nav__drop-icon`}></i>
                      {role.charAt(0).toUpperCase() + role.slice(1)} Login
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="site-nav__hamburger"
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

      </div>
    </nav>
  );
};

export default Navbar;
