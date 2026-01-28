const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function setupAuth(pool) {
  // Passport serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let result = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      if (result.rows.length > 0) {
        // User exists, return user
        return done(null, result.rows[0]);
      } else {
        // Create new user
        result = await pool.query(
          'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *',
          [profile.id, profile.emails[0].value, profile.displayName]
        );
        return done(null, result.rows[0]);
      }
    } catch (err) {
      return done(err, null);
    }
  }));

  return passport;
}

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = { setupAuth, requireAuth };
