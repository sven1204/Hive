import { Link } from 'react-router-dom';
import { Sparkles, Compass, Plus, ArrowDown } from 'lucide-react';
import MapView from '../components/MapView';
import HowItWorks from '../components/HowItWorks';
import classes from './Home.module.css';

function Home() {
  return (
    <div>
      <section className={classes.hero}>
        <div className={classes.heroGlow1} />
        <div className={classes.heroGlow2} />

        <div className={classes.heroInner}>
          <span className={classes.badge}>
            <Sparkles size={14} />
            Fais avancer ton projet
          </span>

          <h1 className={classes.title}>
            Trouve les bonnes personnes pour <span className={classes.titleAccent}>faire naître ton projet</span>
          </h1>

          <p className={classes.subtitle}>
            Hive connecte les porteurs de projets aux personnes qui ont les compétences
            pour les faire vivre — un club de foot du dimanche, un site web, ou une idée
            qui n'attend que la bonne équipe. Explore la carte ou lance le tien.
          </p>

          <div className={classes.actions}>
            <Link to="/projects" className={classes.primaryCta}>
              <Compass size={17} />
              Explorer les projets
            </Link>
            <Link to="/create-project" className={classes.secondaryCta}>
              <Plus size={17} />
              Créer un projet
            </Link>
          </div>

          <button
            type="button"
            className={classes.scrollCue}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label="En savoir plus sur Hive"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </section>

      <HowItWorks />

      <MapView />
    </div>
  );
}

export default Home;
