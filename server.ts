import './server/env';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PlayerReview } from './src/types';
import { addPersistedReview, ensureBootstrapped, getSnapshot, removePersistedReview, syncSeason, syncWeek } from './server/liveStore';
import { getApiSportsKey, getLeagueId } from './server/apiSports';
import { isSupabaseConfigured } from './server/supabase';
import { envNumber } from './server/env';

async function startServer() {
  const app = express();
  const PORT = envNumber('PORT', 3000);

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const snap = getSnapshot();
    res.json({
      status: 'ok',
      service: 'Futbol Unite Live Backend',
      timestamp: new Date().toISOString(),
      matches: snap.matches.length,
      source: snap.source,
    });
  });

  app.get('/api/live/status', (_req, res) => {
    const snap = getSnapshot();
    const key = getApiSportsKey();
    res.json({
      online: true,
      lastSync: snap.lastSync,
      source: snap.source,
      matchesCount: snap.matches.length,
      league: snap.league,
      season: snap.season,
      apiSports: {
        configured: Boolean(key),
        leagueId: getLeagueId(),
        keyMasked: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'Yok',
      },
      supabase: {
        configured: isSupabaseConfigured(),
      },
    });
  });

  app.get('/api/live/matches', async (_req, res) => {
    await ensureBootstrapped();
    const snap = getSnapshot();
    res.json({
      success: true,
      matches: snap.matches,
      standings: snap.standings,
      reviews: snap.reviews,
      league: snap.league,
      lastSync: snap.lastSync,
      source: snap.source,
      count: snap.matches.length,
    });
  });

  app.post('/api/live/sync', async (req, res) => {
    try {
      const week = Number(req.body?.week);
      const snap = Number.isFinite(week) && week > 0 ? await syncWeek(week) : await syncSeason(true);
      res.json({
        success: true,
        matches: snap.matches,
        standings: snap.standings,
        reviews: snap.reviews,
        league: snap.league,
        lastSync: snap.lastSync,
        source: snap.source,
        message: 'Süper Lig verileri API-SPORTS ile güncellendi.',
      });
    } catch (error: any) {
      const snap = getSnapshot();
      res.json({
        success: snap.matches.length > 0,
        matches: snap.matches,
        standings: snap.standings,
        league: snap.league,
        lastSync: snap.lastSync,
        source: snap.source,
        message: error?.message || 'Senkron sırasında hata oluştu.',
      });
    }
  });

  app.get('/api/reviews', (_req, res) => {
    res.json({ success: true, reviews: getSnapshot().reviews });
  });

  app.post('/api/reviews', async (req, res) => {
    const review = req.body as PlayerReview;
    if (!review?.id || !review.matchId) {
      return res.status(400).json({ error: 'Geçersiz yorum' });
    }
    await addPersistedReview(review);
    res.json({ success: true, review });
  });

  app.delete('/api/reviews/:id', async (req, res) => {
    const reviewId = String(req.params.id || '');
    if (!reviewId) {
      return res.status(400).json({ error: 'Geçersiz yorum' });
    }
    await removePersistedReview(reviewId);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Futbol Unite live server running on http://0.0.0.0:${PORT}`);
    void ensureBootstrapped();
  });
}

startServer().catch((error) => {
  console.error('Sunucu başlatılamadı:', error);
  process.exit(1);
});
