import express from "express";
import helmet from "helmet";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const app = express();
const router = express.Router();

app.set("trust proxy", 1);

// Configure dynamic CORS whitelist to prevent wildcard exposure while keeping preview/dev robust
const allowedOrigins = ["https://circle-fund.vercel.app"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
    
    if (allowedOrigins.includes(origin) || isLocalhost) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Throttling for authentication attempts (nonce and verify) to prevent bots/bruting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,             // limit each IP to 10 requests per window
  message: { error: "Too many authentication requests from this IP. Please try again after 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use("/auth", authLimiter);

// Global rate limiter for all API endpoints
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(globalLimiter);

// Enforce JWT secret check to avoid fallback in production
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  console.warn("[Auth] SUPABASE_JWT_SECRET not set — auth endpoints will fail.");
}
const secret = jwtSecret || "";

function generateStatelessNonce(): string {
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
    res.status(500).json({ error: "Internal Server Error" });
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
      const allowedAdminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
      
      const payload = {
        role: "authenticated",
        aud: "authenticated",
        sub: data.address.toLowerCase(),
        wallet_address: data.address.toLowerCase(),
        admin: allowedAdminWallet !== "" && data.address.toLowerCase() === allowedAdminWallet,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
      };
      
      const token = jwt.sign(payload, secret);
      
      // Ensure user profile exists in database immediately upon login
      try {
        const adminToken = generateAdminToken();
        const supabaseAdmin = getSupabaseClient(adminToken);
        await supabaseAdmin
          .from("profiles")
          .upsert({ wallet_address: data.address.toLowerCase() }, { onConflict: "wallet_address" });
      } catch (e) {
        console.error("Error creating profile during SIWE verify:", e);
      }

      return res.json({ ok: true, token });
    } else {
       return res.status(401).json({ error: "Invalid signature." });
    }
  } catch (e: any) {
    console.error("Error verification:", e);
    res.status(400).json({ error: "Invalid request parameters." });
  }
});

// Helper to authenticate user from authorization header
function authenticateUser(req: any): { wallet_address: string; admin: boolean } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, secret) as any;
    return {
      wallet_address: decoded.wallet_address,
      admin: decoded.admin || false,
    };
  } catch (err) {
    console.error("authenticateUser verification failed:", err);
    return null;
  }
}

// Generate admin token using service_role to bypass Row-Level Security
function generateAdminToken(): string {
  const payload = {
    role: "service_role",
    aud: "authenticated",
    sub: "backend_admin",
    wallet_address: "backend_admin",
    admin: true,
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute
  };
  return jwt.sign(payload, secret);
}

// Initialize Supabase admin client
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

function getSupabaseClient(token?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// Claim Milestone funds endpoint
router.post("/milestones/:id/claim", async (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const milestoneId = req.params.id;
  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    // Fetch milestone
    const { data: milestone, error: fetchErr } = await supabaseAdmin
      .from("milestones")
      .select("*, proposals(*)")
      .eq("id", milestoneId)
      .single();

    if (fetchErr || !milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    if (milestone.proposals.author_wallet.toLowerCase() !== user.wallet_address.toLowerCase()) {
      return res.status(403).json({ error: "Only the author of this proposal can claim its milestones" });
    }

    if (milestone.status !== "approved") {
      return res.status(400).json({ error: "Milestone is not approved for claiming" });
    }

    // Ensure authorized user profile row exists in database before status transition triggers a claim update
    const authorWallet = milestone.proposals.author_wallet.toLowerCase();
    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ wallet_address: authorWallet }, { onConflict: "wallet_address" });
    if (upsertErr) {
      console.error("Error ensuring profile exists during milestone claim:", upsertErr);
    }

    // Update status to claimed
    const { data, error: updateErr } = await supabaseAdmin
      .from("milestones")
      .update({ status: "claimed" })
      .eq("id", milestoneId)
      .select();

    if (updateErr) throw updateErr;

    // Fetch the updated profiles total claimed
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("total_claimed")
      .eq("wallet_address", user.wallet_address.toLowerCase())
      .single();

    return res.json({ ok: true, milestone: data[0], total_claimed: prof?.total_claimed || 0 });
  } catch (err: any) {
    console.error("Error during claim processing:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Cast vote endpoint
router.post("/proposals/:id/vote", async (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const proposalId = req.params.id;
  const { vote_type } = req.body;

  if (vote_type !== "upvote" && vote_type !== "downvote") {
    return res.status(400).json({ error: "Invalid vote type" });
  }

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    // Check if user already has a vote
    const { data: existingVote } = await supabaseAdmin
      .from("votes")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("voter_wallet", user.wallet_address.toLowerCase())
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        return res.status(400).json({ error: `You have already cast an ${vote_type} on this proposal.` });
      } else {
        return res.status(400).json({ error: `You have already cast an ${existingVote.vote_type}. Please cancel it first before changing your vote.` });
      }
    }

    // Insert new vote
    const { error: insertErr } = await supabaseAdmin
      .from("votes")
      .insert({
        proposal_id: proposalId,
        voter_wallet: user.wallet_address.toLowerCase(),
        vote_type
      });

    if (insertErr) throw insertErr;

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error casting vote:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Cancel vote endpoint
router.delete("/proposals/:id/vote", async (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const proposalId = req.params.id;

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    const { error: deleteErr } = await supabaseAdmin
      .from("votes")
      .delete()
      .eq("proposal_id", proposalId)
      .eq("voter_wallet", user.wallet_address.toLowerCase());

    if (deleteErr) throw deleteErr;

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error canceling vote:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin endpoints
router.get("/admin/proposals", async (req, res) => {
  const user = authenticateUser(req);
  if (!user || !user.admin) {
    return res.status(403).json({ error: "Forbidden: Admin access list required" });
  }

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);
    
    const { data, error } = await supabaseAdmin
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ proposals: data || [] });
  } catch (err: any) {
    console.error("Error fetching admin proposals:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/admin/reports", async (req, res) => {
  const user = authenticateUser(req);
  if (!user || !user.admin) {
    return res.status(403).json({ error: "Forbidden: Admin access list required" });
  }

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    const { data, error } = await supabaseAdmin
      .from("milestone_reports")
      .select(`*, milestones(*, proposals(title))`)
      .eq("status", "pending");

    if (error) throw error;
    return res.json({ reports: data || [] });
  } catch (err: any) {
    console.error("Error fetching admin reports:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/admin/proposals/:id/status", async (req, res) => {
  const user = authenticateUser(req);
  if (!user || !user.admin) {
    return res.status(403).json({ error: "Forbidden: Admin access list required" });
  }

  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    const { data, error } = await supabaseAdmin
      .from("proposals")
      .update({ status })
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    return res.json({ ok: true, proposal: data?.[0] || null });
  } catch (err: any) {
    console.error("Error updating proposal status:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/admin/reports/:id/status", async (req, res) => {
  const user = authenticateUser(req);
  if (!user || !user.admin) {
    return res.status(403).json({ error: "Forbidden: Admin access list required" });
  }

  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const adminToken = generateAdminToken();
    const supabaseAdmin = getSupabaseClient(adminToken);

    // Update report status
    const { data: updateReportData, error: reportErr } = await supabaseAdmin
      .from("milestone_reports")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (reportErr) throw reportErr;

    // Update milestone status as well
    const { error: msErr } = await supabaseAdmin
      .from("milestones")
      .update({ status: status === "approved" ? "approved" : "rejected" })
      .eq("id", updateReportData.milestone_id);

    if (msErr) throw msErr;

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error updating report status:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/auth/logout", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", router);
app.use("/", router);

export { router };
export default app;
