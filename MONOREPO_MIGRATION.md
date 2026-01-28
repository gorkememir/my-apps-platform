# Migration Guide: Monorepo Structure

## Overview
The project has been restructured into a monorepo containing multiple apps with shared packages.

## New Structure
```
/
├── apps/
│   ├── habit-tracker/    # Original habit tracking app (port 3001)
│   └── chess-game/        # New chess game (port 3002)
├── packages/
│   ├── database/          # Shared PostgreSQL connection
│   ├── auth/              # Shared Google OAuth authentication
│   └── ui-components/     # Shared UI components (navbar, etc.)
├── platform-web/          # Landing page (port 3000)
├── k8s/                   # Kubernetes configs
└── package.json           # Root workspace configuration

## Setup Instructions

### 1. Install Dependencies
```bash
cd /mnt/c/Users/gorke/habit-tracker
npm install
```

This will install dependencies for all workspaces using npm workspaces.

### 2. Database Migration
Update your database name from `habitdb` to `platformdb`:

**Create new tables for chess:**
```sql
CREATE TABLE IF NOT EXISTS chess_games (
  id SERIAL PRIMARY KEY,
  white_player_id INTEGER REFERENCES users(id),
  black_player_id INTEGER REFERENCES users(id),
  board_state TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chess_moves (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES chess_games(id),
  player_id INTEGER REFERENCES users(id),
  move_notation VARCHAR(10) NOT NULL,
  board_state TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Rename existing tables with prefix:**
```sql
-- Keep users table as is (shared)
-- Optionally rename habit tables:
ALTER TABLE habits RENAME TO habit_habits;
```

### 3. Update Environment Variables
Update your `.env` or k8s configs:
```
POSTGRES_DB=platformdb  # Changed from habitdb
```

### 4. Running the Apps

**All apps together:**
```bash
npm run dev:all
```

**Individual apps:**
```bash
npm run habit:dev     # Habit tracker on :3001
npm run chess:dev     # Chess game on :3002
npm run platform:dev  # Landing page on :3000
```

### 5. Update Google OAuth
Add these redirect URIs to Google Console:
- http://localhost:3001/auth/google/callback (habit-tracker)
- http://localhost:3002/auth/google/callback (chess-game)

### 6. Shared Packages
Apps now use shared packages:
- `@my-platform/database` - PostgreSQL pool
- `@my-platform/auth` - Passport setup and auth middleware
- `@my-platform/ui-components` - Shared navbar with app links

### 7. Next Steps
- [ ] Update habit-tracker to use shared packages
- [ ] Implement real chess logic (currently basic board only)
- [ ] Add WebSocket support for real-time chess
- [ ] Update Buy Me a Coffee link with your actual URL
- [ ] Deploy all apps with updated k8s configs
- [ ] Set up CI/CD for monorepo

## Port Assignments
- 3000: Platform landing page
- 3001: Habit Tracker
- 3002: Chess Game
- 3003+: Future apps
