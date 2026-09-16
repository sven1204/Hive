import { useEffect, useRef } from 'react';
import { MapPin, Users, Sparkles } from 'lucide-react';
import classes from './HowItWorks.module.css';

const STEPS = [
  {
    shape: 'pin',
    Icon: MapPin,
    title: 'Découvre les projets autour de toi',
    description: "Explore la carte interactive et repère les projets qui vivent près de chez toi, filtrés par compétences et par domaine.",
  },
  {
    shape: 'link',
    Icon: Users,
    title: 'Rejoins une équipe qui te ressemble',
    description: "Propose tes compétences, échange avec les porteurs de projet, et embarque sur une aventure qui te correspond.",
  },
  {
    shape: 'spark',
    Icon: Sparkles,
    title: 'Lance ton propre projet',
    description: "Publie ton idée en quelques minutes et laisse les bonnes personnes venir la faire grandir avec toi.",
  },
];

/* Section "sales pitch" affichée entre le hero et la carte : présente le principe
   du site en 3 points, avec une apparition progressive au scroll (IntersectionObserver). */
function HowItWorks() {
  const containerRef = useRef(null);

  useEffect(() => {
    const nodes = containerRef.current?.querySelectorAll(`.${classes.step}`);
    if (!nodes || nodes.length === 0) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      nodes.forEach((node) => node.classList.add(classes.visible));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(classes.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -60px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={classes.section} id="how-it-works" ref={containerRef}>
      <div className={classes.header}>
        <span className={classes.eyebrow}>Comment ça marche</span>
        <h2 className={classes.title}>Trois étapes pour donner vie à ton projet</h2>
        <p className={classes.subtitle}>
          Hive simplifie la rencontre entre les idées et les compétences qui les font avancer.
        </p>
      </div>

      <div className={classes.grid}>
        {STEPS.map((step, index) => (
          <div key={step.title} className={classes.step} style={{ transitionDelay: `${index * 100}ms` }}>
            <div className={`${classes.visual} ${classes[step.shape]}`}>
              <step.Icon size={22} className={classes.visualIcon} />
            </div>
            <span className={classes.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
            <h3 className={classes.stepTitle}>{step.title}</h3>
            <p className={classes.stepDescription}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
