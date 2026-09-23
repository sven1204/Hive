import { Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Plus, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MapView from '../components/MapView';
import HowItWorks from '../components/HowItWorks';
import HeroNetwork from '../components/HeroNetwork';
import DecodeText from '../components/DecodeText';
import classes from './Home.module.css';

function Home() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const mainWords = t("home.titleMain").split(' ');
  // Chaque mot apparaît avec 70 ms d'écart ; la partie accent se décode juste après.
  const accentDelay = 150 + mainWords.length * 70;

  return (
    <div>
      <section className={classes.hero} ref={heroRef}>
        <HeroNetwork pointerTarget={heroRef} />
        <div className={classes.heroGlow1} />
        <div className={classes.heroGlow2} />

        <div className={classes.heroInner} style={{ '--accent-delay': `${accentDelay}ms` }}>
          <h1 className={classes.title}>
            <span className="sr-only">{t("home.titleMain")} {t("home.titleAccent")}</span>
            <span aria-hidden="true">
              {mainWords.map((word, index) => (
                <Fragment key={`${word}-${index}`}>
                  <span className={classes.word} style={{ '--i': index }}>{word}</span>{' '}
                </Fragment>
              ))}
            </span>
            <span className={classes.titleAccent}>
              <DecodeText text={t("home.titleAccent")} delay={accentDelay} duration={950} />
            </span>
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
