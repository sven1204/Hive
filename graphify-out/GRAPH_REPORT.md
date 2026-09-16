# Graph Report - hive  (2026-09-15)

## Corpus Check
- 114 files · ~50,193 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 28 file(s) not represented in the graph (top: .css 20, (none) 5, .example 1)

## Summary
- 595 nodes · 1048 edges · 31 communities (25 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.82)
- Token cost: 253,718 input · 0 output

## Community Hubs (Navigation)
- Frontend UI Components
- Project Controller & Matching
- Database & Mongoose Models
- Map View Component
- Frontend Package Config
- Frontend Test Suite
- Express Server & Routes
- Admin Controller
- Auth Controller
- Docker Compose Services
- Messages Controller
- Join Request Controller
- Backend Package Config
- Frontend Dependencies
- Backend Dependencies
- Password Strength & Registration
- Prometheus Metrics
- Projects Route & Auth Middleware
- PWA Manifest
- Root Package Config
- i18n Test Mocks (frontend)
- i18n Test Mocks (src)
- Health Check Endpoint
- Deployment & Static Assets Docs
- NPM Scripts
- App Icon Brand Identity (192px)
- App Icon Brand Identity (512px)
- Cracked Egg Logo Metaphor
- Unused React Logo Asset

## God Nodes (most connected - your core abstractions)
1. `react-router-dom` - 33 edges
2. `useAuth()` - 29 edges
3. `react` - 27 edges
4. `api()` - 24 edges
5. `react-i18next` - 18 edges
6. `lucide-react` - 17 edges
7. `@testing-library/react` - 15 edges
8. `mongoose` - 12 edges
9. `@testing-library/user-event` - 12 edges
10. `useTheme()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Traefik Service (local)` --semantically_similar_to--> `Traefik Service (prod)`  [INFERRED] [semantically similar]
  docker-compose.traefik-local.yml → docker-compose.prod.yml
- `cAdvisor (Documented but Not Defined)` --references--> `Prometheus Service (dev)`  [AMBIGUOUS]
  README.md → docker-compose.dev.yml
- `Hive Project Architecture` --conceptually_related_to--> `Hive App HTML Shell`  [INFERRED]
  README.md → frontend/public/index.html
- `Prometheus Scrape Job: backend` --references--> `Backend Service (dev)`  [INFERRED]
  monitoring/prometheus.yml → docker-compose.dev.yml
- `Frontend Service (dev)` --references--> `npm start Script`  [INFERRED]
  docker-compose.dev.yml → frontend/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Monitoring & Observability Provisioning** — monitoring_prometheus_config, monitoring_grafana_provisioning_datasources_prometheus_datasource, monitoring_grafana_provisioning_dashboards_dashboards_provider [INFERRED 0.85]
- **Backend/Frontend Service Pair Across Deployment Environments** — docker_compose_dev_backend, docker_compose_dev_frontend, docker_compose_prod_backend, docker_compose_prod_frontend, docker_compose_traefik_local_backend, docker_compose_traefik_local_frontend [INFERRED 0.85]
- **Traefik Reverse Proxy Routing Group (Prod)** — docker_compose_prod_traefik, docker_compose_prod_backend, docker_compose_prod_frontend, docker_compose_prod_grafana [INFERRED 0.85]

## Communities (31 total, 4 thin omitted)

### Community 0 - "Frontend UI Components"
Cohesion: 0.08
Nodes (52): App(), BottomNav(), FloatingField(), ForgotPasswordForm(), formatTimeAgo(), Header(), getRatingValue(), HiveRating() (+44 more)

### Community 1 - "Project Controller & Matching"
Cohesion: 0.05
Nodes (36): buildVector(), { containsProfanity }, Conversation, cosinSimilarity(), createProject(), getRecommended(), Message, normalizeProjectPayload() (+28 more)

### Community 2 - "Database & Mongoose Models"
Cohesion: 0.05
Nodes (40): closeDB(), connectDB(), mongoose, normalizeMongoUri(), mongoose, schema, messageSchema, mongoose (+32 more)

### Community 3 - "Map View Component"
Cohesion: 0.08
Nodes (27): createClusterIcon(), DEFAULT_CENTER, formatAgeLabel(), formatDate(), getClusterRadius(), getProjectPosition(), MapView(), PanToSelected() (+19 more)

### Community 4 - "Frontend Package Config"
Cohesion: 0.06
Nodes (31): browserslist, development, production, devDependencies, baseline-browser-mapping, eslintConfig, extends, name (+23 more)

### Community 5 - "Frontend Test Suite"
Cohesion: 0.07
Nodes (25): mockResetPassword, mockVerifyResetCode, mockApi, mockUseAuth, fakeProjects, fakeUsers, mockApi, mockNavigate (+17 more)

### Community 6 - "Express Server & Routes"
Cohesion: 0.07
Nodes (27): adminRoutes, app, authRoutes, client, { connectDB, closeDB }, { containsProfanity }, Conversation, cors (+19 more)

### Community 7 - "Admin Controller"
Cohesion: 0.07
Nodes (16): Project, User, loginLimiter, rateLimit, jwt, adminController, requireAdmin, requireAuth (+8 more)

### Community 8 - "Auth Controller"
Cohesion: 0.10
Nodes (18): assignEmailVerificationCode(), bcrypt, forgotPassword(), generateVerificationCode(), jwt, register(), { registrationsTotal, loginsTotal }, resendVerificationEmail() (+10 more)

### Community 9 - "Docker Compose Services"
Cohesion: 0.11
Nodes (28): Backend Service (dev), Frontend Service (dev), Grafana Service (dev), MongoDB Service (dev), MongoDB Exporter Service (dev), Prometheus Service (dev), Backend Service (prod), Frontend Service (prod) (+20 more)

### Community 10 - "Messages Controller"
Cohesion: 0.08
Nodes (4): Conversation, Message, Notification, User

### Community 11 - "Join Request Controller"
Cohesion: 0.12
Nodes (20): acceptRequest(), Conversation, declineRequest(), getMyRequest(), getProjectRequests(), { joinRequestsTotal }, Message, Notification (+12 more)

### Community 12 - "Backend Package Config"
Cohesion: 0.11
Nodes (18): author, description, devDependencies, nodemon, express-rate-limit, keywords, license, main (+10 more)

### Community 13 - "Frontend Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, axios, i18next, i18next-browser-languagedetector, leaflet, lucide-react, react, react-dom (+11 more)

### Community 14 - "Backend Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+7 more)

### Community 15 - "Password Strength & Registration"
Cohesion: 0.24
Nodes (9): computeEntropy(), getStrengthLabel(), PasswordStrengthMeter(), RULES, RegisterForm(), Register(), mockRegister, mockResendVerificationEmail (+1 more)

### Community 16 - "Prometheus Metrics"
Cohesion: 0.20
Nodes (9): { Counter, Gauge }, joinRequestsTotal, loginsTotal, messagesSentTotal, projectsClosedTotal, projectsCreatedTotal, registrationsTotal, socketConnectionsActive (+1 more)

### Community 17 - "Projects Route & Auth Middleware"
Cohesion: 0.22
Nodes (7): jwt, controller, express, optionalAuth, requireAuth, router, jsonwebtoken

### Community 18 - "PWA Manifest"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 19 - "Root Package Config"
Cohesion: 0.25
Nodes (7): dependencies, express-rate-limit, i18n, natural, express-rate-limit, i18n, natural

### Community 20 - "i18n Test Mocks (frontend)"
Cohesion: 0.40
Nodes (5): fr, i18n, path, resolve(), t()

### Community 21 - "i18n Test Mocks (src)"
Cohesion: 0.40
Nodes (5): fr, i18n, path, resolve(), t()

### Community 22 - "Health Check Endpoint"
Cohesion: 0.40
Nodes (3): getHealth(), router, express

### Community 23 - "Deployment & Static Assets Docs"
Cohesion: 0.40
Nodes (5): Prod Compose (Unused Alternative Config), Hive App HTML Shell, Satoshi Font (Fontshare), robots.txt (Allow All), Hive Project Architecture

### Community 24 - "NPM Scripts"
Cohesion: 0.67
Nodes (3): scripts, dev, start

## Ambiguous Edges - Review These
- `cAdvisor (Documented but Not Defined)` → `Prometheus Service (dev)`  [AMBIGUOUS]
  README.md · relation: references

## Knowledge Gaps
- **266 isolated node(s):** `User`, `Project`, `bcrypt`, `jwt`, `{ registrationsTotal, loginsTotal }` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `cAdvisor (Documented but Not Defined)` and `Prometheus Service (dev)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `react-router-dom` connect `Frontend UI Components` to `Map View Component`, `Frontend Package Config`, `Frontend Test Suite`, `Password Strength & Registration`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `mongoose` connect `Database & Mongoose Models` to `Project Controller & Matching`, `Backend Package Config`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Backend Package Config`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `User`, `Project`, `bcrypt` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07523510971786834 - nodes in this community are weakly interconnected._
- **Should `Project Controller & Matching` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._