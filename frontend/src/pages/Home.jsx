import { Link } from 'react-router-dom';
import { Sparkles, Compass, Plus, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MapView from '../components/MapView';
import HowItWorks from '../components/HowItWorks';
import classes from './Home.module.css';

function Home() {
  const { t } = useTranslation();

  return (
    <div>
      <section className={classes.hero}>
        <div className={classes.heroGlow1} />
        <div className={classes.heroGlow2} />

        <div className={classes.heroInner}>
          <span className={classes.badge}>
            <Sparkles size={14} />
            {t("home.badge")}
          </span>

          <h1 className={classes.title}>
            {t("home.titleMain")} <span className={classes.titleAccent}>{t("home.titleAccent")}</span>
          </h1>

          <p className={classes.subtitle}>
            {t("home.subtitle")}
          </p>

          <div className={classes.actions}>
            <Link to="/projects" className={classes.primaryCta}>
              <Compass size={17} />
              {t("home.explore")}
            </Link>
            <Link to="/create-project" className={classes.secondaryCta}>
              <Plus size={17} />
              {t("home.createProject")}
            </Link>
          </div>

          <button
            type="button"
            className={classes.scrollCue}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={t("home.scrollCue")}
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </section>

      <HowItWorks />

      <section className={classes.mapIntro}>
        <span className={classes.mapIntroEyebrow}>{t("home.mapEyebrow")}</span>
        <h2 className={classes.mapIntroTitle}>{t("home.mapTitle")}</h2>
      </section>

      <MapView />
    </div>
  );
}

export default Home;
