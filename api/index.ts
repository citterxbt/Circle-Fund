
import express from "express";
import helmet from "helmet";
import apiRouter from "./router";

const app = express();
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(express.json());
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
