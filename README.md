# Guide d'installation — *Hive*

Ce document explique comment installer et lancer l'environnement technique
complet du projet **Hive** à l'aide de **Docker**.

L'objectif est de garantir un environnement reproductible, simple à lancer
et identique pour tous les développeurs.

---

## Architecture du projet

Le projet Hive repose sur une architecture **client–serveur** dockerisée.

```
hive/
├── backend/                    # API Node.js / Express
├── frontend/                   # Application React
├── monitoring/                 # Config Prometheus + dashboards Grafana
│   ├── prometheus.yml
│   └── grafana/
├── dockerlocal/                # Docker Compose pour la documentation MkDocs
│   ├── docker-compose.yml
│   └── Dockerfile
├── docs/                       # Documentation MkDocs
├── docker-compose.dev.yml      # Environnement de développement local
├── docker-compose.prod.yml     # Config alternative VPS + Traefik (non utilisée en prod)
├── docker-compose.traefik-local.yml
├── mkdocs.yml                  # Configuration de la documentation
├── .gitlab-ci.yml
├── .gitignore
└── README.md
```

---

## Prérequis

Avant de commencer, installer uniquement :

| Outil | Version recommandée |
|------|----------------------|
| **Docker** | ≥ 24 |
| **Docker Compose** | intégré |
| **Git** | dernière version |
| **Postman** | pour tester l'API |

**Node.js, MongoDB et npm sont gérés par Docker.**

---

## Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# ── Backend ────────────────────────────────────────
PORT=5050
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/hive
JWT_SECRET=<secret_fort>
JWT_EXPIRES_IN=15m
FRONT_URL=http://localhost:3000

# ── Mail SMTP (Zoho) ───────────────────────────────
MAIL_HOST=smtp.zoho.eu
MAIL_PORT=465
MAIL_USER=contact@votre-domaine.com
MAIL_PASS=<mot_de_passe_smtp>
MAIL_FROM_EMAIL=no-reply@votre-domaine.com
MAIL_FROM_NAME=Hive

# ── Monitoring ─────────────────────────────────────
GRAFANA_USER=admin
GRAFANA_PASSWORD=<mot_de_passe_grafana>

```

Le fichier `.env` ne doit **jamais** être versionné.

---

## Lancement du projet

### Développement local (application complète)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Lance : backend, frontend, MongoDB, Prometheus, Grafana, cAdvisor, MongoDB Exporter.

### Documentation MkDocs (hot-reload)

```bash
cd dockerlocal
docker compose up --build
```

Lance le serveur MkDocs avec rechargement automatique à chaque modification.

---

## Accès aux services

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5050 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| cAdvisor | http://localhost:8081 |
| Documentation MkDocs | http://localhost:8000 |

---

## Test de l'API avec Postman

Postman est utilisé pour tester et valider les endpoints du backend.

### Exemples de tests :
- authentification (`/api/auth/login`)
- inscription utilisateur (`/api/auth/register`)
- récupération de mot de passe (`/api/auth/forgot-password`)
- routes protégées avec token JWT

Les requêtes protégées doivent inclure le header :

```
Authorization: Bearer <token>
```

---

## Arrêt du projet

```bash
docker compose -f docker-compose.dev.yml down
```

---

## Dépannage

### Le backend ne démarre pas
- vérifier le fichier `.env` (toutes les variables requises)
- vérifier les logs Docker :
```bash
docker compose -f docker-compose.dev.yml logs backend
```

### Le frontend ne communique pas avec l'API
- vérifier `FRONT_URL` dans le `.env`
- vérifier que le backend est bien exposé sur le port `5050`

### Problème de ports
- modifier les ports dans `docker-compose.dev.yml`
- relancer avec `--build`

---

## Conclusion

L'utilisation de Docker permet :
- un lancement rapide du projet
- une configuration simplifiée
- une architecture cohérente
- une meilleure reproductibilité
