import express from 'express';
import path from 'path';
import { generateNonce, SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

app.set('trust proxy', 1); // Trust first proxy for rate limiting (Cloud Run/Nginx)

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: false // Disabled for Vite HMR and local UI loading
}));

app.use(express.json());

// Apply rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);

// In-memory nonce store (for prototype). In prod, use express-session or redis.
const nonceStore = new Map<string, number>();

app.get('/api/auth/nonce', (req, res) => {
  const nonce = generateNonce();
  nonceStore.set(nonce, Date.now());
  res.json({ nonce });
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // Validate nonce
    if (!nonceStore.has(siweMessage.nonce)) {
      return res.status(422).json({ error: 'Invalid nonce.' });
    }
    // Clean up nonce (single use)
    nonceStore.delete(siweMessage.nonce);
    
    const { success, data } = await siweMessage.verify({ signature });
    if (success && data) {
      // Create custom Supabase JWT
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "Missing SUPABASE_JWT_SECRET environment variable." });
      
      const payload = {
        role: "authenticated",
        aud: "authenticated",
        sub: data.address.toLowerCase(),
        wallet_address: data.address.toLowerCase(),
        admin: data.address.toLowerCase() === process.env.VITE_ADMIN_WALLET?.toLowerCase(),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 1 day expiration
      };
      
      const token = jwt.sign(payload, secret);
      return res.json({ ok: true, token });
    } else {
       return res.status(401).json({ error: 'Invalid signature.' });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
