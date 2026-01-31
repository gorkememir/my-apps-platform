# My Apps Platform

A monorepo containing multiple web applications (Habit Tracker, Chess Game) with shared packages for authentication, database, and UI components. Deployed on Kubernetes with GitOps using ArgoCD.

## Applications

- **Habit Tracker**: Daily habit tracking with Google OAuth authentication
- **Chess Game**: Multiplayer chess game with Google OAuth authentication
- **Platform Web**: Landing page for all applications

## Features

- ✅ Add and track daily habits
- 🗑️ Delete habits
- 📊 View all habits with timestamps
- 🌓 Dark mode support
- 📤 Export habits to CSV
- 🔄 Self-healing database schema
- 🚀 Automated CI/CD with semantic versioning
- 🎯 GitOps deployment via ArgoCD

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (external LXC container)
- **Frontend**: EJS templates
- **Authentication**: Passport.js + Google OAuth 2.0
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions + ArgoCD (GitOps)
- **Infrastructure**: Proxmox (K8s cluster + LXC containers)
- **Registry**: Docker Hub
- **Proxy**: Cloudflare Tunnel

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally or in LXC container)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/gorkememir/my-apps-platform.git
cd my-apps-platform
```

2. Install root dependencies:
```bash
npm install
```

3. Install app-specific dependencies:
```bash
cd apps/habit-tracker
npm install
```

4. Configure environment variables:
```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=habitdb
export POSTGRES_HOST=localhost  # or LXC container IP
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
export GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
export SESSION_SECRET=your_session_secret
```

5. Run the app:
```bash
node app.js
```

6. Open http://localhost:8080

## Docker

Build and run with Docker:

```bash
docker build -t gorkememir/habit-tracker:latest .
docker run -p 8080:8080 habit-tracker
```

Push to Docker Hub:
```bash
docker push gorkememir/habit-tracker:latest
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (self-hosted on Proxmox)
- ArgoCD installed
- Docker Hub credentials configured in GitHub Secrets

### CI/CD Pipeline

The project uses a GitOps workflow with semantic versioning:

1. **Developer pushes to `main` branch**
2. **GitHub Actions workflow triggers:**
   - Builds Docker image with commit SHA tag
   - Pushes to Docker Hub
   - Determines semantic version from commit message:
     - `feat:` → minor bump (v1.1.0)
     - `fix:` → patch bump (v1.0.1)
     - `feat!:` or `BREAKING CHANGE:` → major bump (v2.0.0)
   - Updates manifest in `release` branch with new image
   - Creates version tag (e.g., v1.2.3)
3. **ArgoCD watches `release` branch**
   - Auto-syncs changes to Kubernetes (30s interval)
   - Deploys new version to cluster

### PostgreSQL LXC Container Setup

PostgreSQL runs in a separate LXC container for better resource management and isolation.

1. **Configure PostgreSQL to accept external connections:**

```bash
# SSH into PostgreSQL LXC container
ssh root@192.168.2.138

# Edit postgresql.conf to listen on all interfaces
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: listen_addresses = '*'

# Edit pg_hba.conf to allow connections from Kubernetes pods
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add these lines:
# host    all             all             192.168.0.0/16          md5
# host    all             all             10.0.0.0/8              md5

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify it's listening
sudo ss -tlnp | grep 5432
```

2. **Create Kubernetes secrets:**

```bash
kubectl create namespace habit-tracker

kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=your_password \
  --from-literal=POSTGRES_DB=habitdb \
  -n habit-tracker

kubectl create secret generic google-oauth-secret \
  --from-literal=GOOGLE_CLIENT_ID=your_client_id \
  --from-literal=GOOGLE_CLIENT_SECRET=your_client_secret \
  --from-literal=SESSION_SECRET=your_session_secret \
  -n habit-tracker
```

3. **Apply application:**
```bash
kubectl apply -f k8s/habit-app.yml
```

4. **Access the app:**
```
http://<NODE_IP>:30007
```

### ArgoCD Deployment (Automated)

1. Install ArgoCD in your cluster:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. Apply the ArgoCD application:
```bash
kubectl apply -f k8s/argocd-app.yaml
```

3. ArgoCD will automatically:
   - Monitor the `release` branch
   - Sync changes to the cluster every 30 seconds
   - Self-heal any configuration drift
   - Prune deleted resources

## Architecture

```
┌──────────────────────────────────────────────────┐
│              GitHub Repository                    │
│  ┌──────────┐              ┌────────────┐       │
│  │   main   │              │  release   │       │
│  └────┬─────┘              └─────▲──────┘       │
│       │                           │              │
└───────┼───────────────────────────┼──────────────┘
        │                           │
        ▼                           │
┌─────────────────┐                 │
│ GitHub Actions  │─────────────────┘
│ • Build Docker  │
│ • Push to Hub   │
│ • Semantic Ver  │
│ • Update K8s    │
└─────────────────┘
                                    
┌───────────────────────────────────────────┐
│            Kubernetes Cluster             │
│                                           │
│  ┌─────────────┐                         │
│  │   ArgoCD    │ ← Watches release branch│
│  └──────┬──────┘                         │
│         │ (syncs every 30s)              │
│         ▼                                 │
│  ┌──────────────────────┐                │
│  │  habit-tracker-app   │                │
│  │    (2 replicas)      │                │
│  │  NodePort: 30007     │                │
│  └──────────┬───────────┘                │
│             │                             │
│  ┌──────────▼───────────┐                │
│  │   PostgreSQL DB      │                │
│  │   (StatefulSet)      │                │
│  └──────────────────────┘                │
└───────────────────────────────────────────┘
```

## GitOps Workflow

```
Developer                GitHub Actions           ArgoCD              Kubernetes
    │                          │                     │                     │
    │ git push main           │                     │                     │
    ├─────────────────────────>│                     │                     │
    │                          │ Build & Push        │                     │
    │                          │ Docker Image        │                     │
    │                          ├──────────>          │                     │
    │                          │                     │                     │
    │                          │ Create version tag  │                     │
    │                          │ (v1.2.3)           │                     │
    │                          │                     │                     │
    │                          │ Update manifest     │                     │
    │                          │ Push to release     │                     │
    │                          ├────────────────────>│                     │
    │                          │                     │                     │
    │                          │                     │ Detect change       │
    │                          │                     │ (30s poll)          │
    │                          │                     │                     │
    │                          │                     │ Sync & Deploy       │
    │                          │                     ├────────────────────>│
    │                          │                     │                     │
    │<──────────────────────────────────────────────┴─────────────────────┤
    │                    App deployed with new version                     │
```

## Project Structure

```
my-apps-platform/
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline with semantic versioning
├── apps/
│   ├── habit-tracker/
│   │   ├── app.js              # Habit tracker application
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── views/              # EJS templates
│   ├── chess-game/
│   │   ├── app.js              # Chess game application
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── views/
│   └── platform-web/
│       └── app.js              # Landing page
├── packages/
│   ├── auth/                   # Shared authentication logic
│   ├── database/               # Shared database utilities
│   └── ui-components/          # Shared UI components
├── k8s/
│   ├── habit-app.yml           # Habit tracker deployment
│   └── argocd-app.yaml         # ArgoCD application config
├── fix-postgres-access.sh      # PostgreSQL LXC setup script
├── GOOGLE_OAUTH_SETUP.md       # OAuth setup instructions
├── MONOREPO_MIGRATION.md       # Migration guide
└── README.md                   # This file
```

## Configuration

### GitHub Secrets Required
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

### Commit Message Convention

Use conventional commits for automatic semantic versioning:

- `feat: add new feature` → Minor version bump (v1.1.0)
- `fix: resolve bug` → Patch version bump (v1.0.1)  
- `feat!: breaking change` → Major version bump (v2.0.0)
- `docs: update readme` → Patch version bump (v1.0.1)
- `BREAKING CHANGE:` in body → Major version bump (v2.0.0)

## Environment

- **Kubernetes**: Self-hosted on Proxmox
- **PostgreSQL**: LXC container at 192.168.2.138:5432
- **Docker Registry**: Docker Hub (gorkememir/*)
- **Domain**: emirpalace.ca (via Cloudflare Tunnel)
- **Branches**: 
  - `main`: Development branch
  - `release`: Production branch (watched by ArgoCD)

## Troubleshooting

### PostgreSQL Connection Issues

If you see `ECONNREFUSED` errors:

1. **Check PostgreSQL is running:**
```bash
ssh root@192.168.2.138
sudo systemctl status postgresql
sudo ss -tlnp | grep 5432
```

2. **Verify pg_hba.conf syntax:**
```bash
# Check for syntax errors (common: incomplete lines)
sudo tail -20 /var/log/postgresql/postgresql-*.log
```

3. **Test connection from Kubernetes:**
```bash
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h 192.168.2.138 -U postgres -d habitdb
```

### Google OAuth Issues

See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request to `main`
6. After merge, GitHub Actions will:
   - Build and push Docker image
   - Create semantic version tag
   - Update `release` branch
   - ArgoCD automatically deploys to cluster

## License

MIT
