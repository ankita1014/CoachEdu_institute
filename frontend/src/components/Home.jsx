import Hero        from './Hero';
import ValueProp   from './ValueProp';
import Features    from './Features';
import Highlight   from './Highlight';
import Testimonials from './Testimonials';
import Footer      from './Footer';

const Home = () => (
  <div className="hp-outer">
    <span className="hp-blob hp-blob-1" aria-hidden="true" />
    <span className="hp-blob hp-blob-2" aria-hidden="true" />
    <span className="hp-blob hp-blob-3" aria-hidden="true" />

    <div className="hp-card">
      <Hero />
      <ValueProp />
      <Features />
      <Highlight />
      <Testimonials />
      <Footer />
    </div>
  </div>
);

export default Home;
