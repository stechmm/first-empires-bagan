import { Game } from './core/Game.js';

window.addEventListener('error', (e) => {
  console.error('🚨 Bagan RTS Error:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Bagan RTS Promise Rejection:', e.reason);
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    window.baganGame = game;
    console.log('⚔️ First Empires Bagan (ပုဂံ အင်ပါယာ) Initialized successfully.');
  } catch (err) {
    console.error('🚨 Fatal Game Init Error:', err);
  }
});
