
import { Router } from "express";
import { generateNonce, SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const router = Router();
router.use(cookieParser());

router.get("/auth/nonce", (req, res) => {
  try {
    const nonce = generateNonce();
    res.cookie("siwe_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
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
    
    const storedNonce = req.cookies.siwe_nonce;
    if (!storedNonce || storedNonce !== siweMessage.nonce) {
      return res.status(422).json({ error: "Invalid nonce." });
    }
    
    // Clean up nonce cookie
    res.clearCookie("siwe_nonce", { path: "/" });
    
    const { success, data } = await siweMessage.verify({ signature });
    if (success && data) {
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "Missing SUPABASE_JWT_SECRET environment variable." });
      
      const payload = {
        role: "authenticated",
        aud: "authenticated",
        sub: data.address.toLowerCase(),
        wallet_address: data.address.toLowerCase(),
        admin: data.address.toLowerCase() === process.env.VITE_ADMIN_WALLET?.toLowerCase(),
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
  res.clearCookie("siwe_nonce", { path: "/" });
  res.json({ ok: true });
});

export default router;
