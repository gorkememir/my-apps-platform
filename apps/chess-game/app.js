const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('@my-platform/database');
const { setupAuth, requireAuth } = require('@my-platform/auth');

const app = express();
const passport = setupAuth(pool);

// Configuration
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
});

// Game routes
app.get('/game', requireAuth, async (req, res) => {
  try {
    // Get or create active games for user
    const result = await pool.query(
      `SELECT g.*, 
              u1.name as white_player_name, 
              u2.name as black_player_name
       FROM chess_games g
       LEFT JOIN users u1 ON g.white_player_id = u1.id
       LEFT JOIN users u2 ON g.black_player_id = u2.id
       WHERE (g.white_player_id = $1 OR g.black_player_id = $1)
         AND g.status = 'active'
       ORDER BY g.updated_at DESC`,
      [req.user.id]
    );
    
    res.render('game', { user: req.user, games: result.rows });
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).send('Error loading games');
  }
});

app.post('/game/new', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO chess_games (white_player_id, board_state, status)
       VALUES ($1, $2, 'waiting')
       RETURNING id`,
      [req.user.id, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']
    );
    res.redirect(`/game/${result.rows[0].id}`);
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).send('Error creating game');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Chess game server running on port ${PORT}`);
});
