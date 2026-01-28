# Add database migration SQL
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

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_chess_games_players ON chess_games(white_player_id, black_player_id);
CREATE INDEX IF NOT EXISTS idx_chess_games_status ON chess_games(status);
CREATE INDEX IF NOT EXISTS idx_chess_moves_game ON chess_moves(game_id);
