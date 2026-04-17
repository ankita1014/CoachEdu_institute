import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer>
      <div className="container footer-container">

        <div className="footer-col">
          <Link to="/" className="footer-logo-link">
            <img src={logo} alt="Logo" className="footer-logo-img" />
            <div className="footer-logo-text">
              <div>
                <span className="footer-brand-main">CoachEdu</span>
                <span className="footer-brand-sub"> Institute</span>
              </div>
            </div>
          </Link>

          <p>
            <strong>Teacher:</strong> Mrs. Minakshi Swami
          </p>

          <p className="footer-desc">
            Coaching for primary students (Class 1st to 5th).
          </p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/faculty">Faculty</Link></li>
            <li><Link to="/tests">Tests</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Programs</h4>
          <ul>
            <li>Primary (Class 1-5)</li>
            <li>Basic Foundation</li>
            <li>Homework Support</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact Us</h4>
          <ul>
            <li>Nashik, India</li>
            <li>+91 7875275740</li>
            <li>dnyanminakshi6@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2026 CoachEdu Institute. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;