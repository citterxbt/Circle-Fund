
import express from "express";
import path from "path";
import helmet from "helmet";
import { router as apiRouter } from "./api/index";

const app = express();

app.set("trust proxy", 1);

// Apply security headers with dynamic CSP that protects but works cleanly in web sandboxes
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.run.app",
        "https://rpc.testnet.arc.network",
        "https://*.walletconnect.com",
        "wss://*.walletconnect.com",
        "https://*.walletconnect.org",
        "wss://*.walletconnect.org",
        "https://*.rainbow.me",
        "https://cloudflare-eth.com"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.supabase.co",
        "https://*.walletconnect.com",
        "https://*.rainbow.me",
        "https://safe-transaction-assets.gnosis-safe.io",
        "https://*.ipfs.dweb.link",
        "https://ipfs.io"
      ],
      frameAncestors: ["'self'", "*"],
    }
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(express.json());

// Main API Router
app.use("/api", apiRouter);

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
startServer();
