
import { Router } from "express";
import { generateNonce, SiweMessage } from "siwe";
import jwt from "jsonwebtoken";

const router = Router();

// In-memory nonce store (avoids iframe third-party cookie blocking)
const nonceStore = new Map();

// Clean up expired nonces periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of nonceStore.entries()) {
    if (now - timestamp > 1000 * 60 * 60) {
      nonceStore.delete(nonce);
    }
  }
}, 1000 * 60 * 60);

router.get("/auth/nonce", (req, res) => {
  try {
    const nonce = generateNonce();
    nonceStore.set(nonce, Date.now());
    res.json({ nonce });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

router.post("/auth/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // Check if nonce exists and is valid
    if (!nonceStore.has(siweMessage.nonce)) {
      return res.status(422).json({ error: "Invalid or expired nonce." });
    }
    
    // Clean up nonce (single use)
    nonceStore.delete(siweMessage.nonce);
    
    const { success, data } = await siweMessage.verify({ signature });
    if (success && data) {
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "Missing SUPABASE_JWT_SECRET environment variable." });
      
      const payload = {
        role: "authenticated",
        aud: "authenticated",
        sub: data.address.toLowerCase(),
        wallet_address: data.address.toLowerCase(),
        admin: data.address.toLowerCase() === (process.env.VITE_ADMIN_WALLET || "").toLowerCase(),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
      };
      
      const token = jwt.sign(payload, secret);
      return res.json({ ok: true, token });
    } else {
       return res.status(401).json({ error: "Invalid signature." });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/auth/logout", (req, res) => {
  res.json({ ok: true });
});

export default router;
