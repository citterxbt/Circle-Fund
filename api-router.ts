
import { Router } from "express";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();

function generateStatelessNonce(): string {
  const secret = process.env.SUPABASE_JWT_SECRET || "default_auth_secret_fallback";
  const now = Math.floor(Date.now() / 1000);
  const timestampHex = now.toString(16).padStart(8, "0"); // 8 chars hex
  const randHex = crypto.randomBytes(4).toString("hex"); // 8 chars hex
  
  const payload = timestampHex + randHex;
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const sigHex = hash.slice(0, 16); // 16 chars hex
  
  return payload + sigHex; // 32 chars alphanumeric hex string
}

function verifyStatelessNonce(nonce: string): boolean {
  if (!nonce || nonce.length !== 32) return false;
  
  const secret = process.env.SUPABASE_JWT_SECRET || "default_auth_secret_fallback";
  const timestampHex = nonce.slice(0, 8);
  const randHex = nonce.slice(8, 16);
  const sigHex = nonce.slice(16, 32);
  
  // Verify HMAC signature
  const payload = timestampHex + randHex;
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedSigHex = hash.slice(0, 16);
  
  if (sigHex !== expectedSigHex) {
    console.warn("[verifyStatelessNonce] Nonce signature mismatch:", sigHex, "vs expected:", expectedSigHex);
    return false;
  }
  
  // Verify timestamp is within 15 minutes to allow network delays and clock drift
  const timestamp = parseInt(timestampHex, 16);
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  if (age > 900 || age < -120) { // 15 mins max, 2 min skew
    console.warn("[verifyStatelessNonce] Nonce expired. Age:", age);
    return false;
  }
  
  return true;
}

router.get("/auth/nonce", (req, res) => {
  try {
    const nonce = generateStatelessNonce();
    res.json({ nonce });
  } catch (error: any) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

router.post("/auth/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // Verify nonce statelessly
    if (!verifyStatelessNonce(siweMessage.nonce)) {
      return res.status(422).json({ error: "Invalid, expired, or tampered SIWE nonce." });
    }
    
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
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/auth/logout", (req, res) => {
  res.json({ ok: true });
});

export default router;
