import express from "express";
import axios from "axios";
import "dotenv/config";

const PORT = process.env.PORT || 8080;
const CHATWORK_TOKEN = process.env.CHATWORK_TOKEN;
const CHATWORK_ROOM_ID = process.env.CHATWORK_ROOM_ID;
const SHARED_SECRET = process.env.SHARED_SECRET || null;
const MESSAGE_PREFIX = process.env.MESSAGE_PREFIX || "";

if (!CHATWORK_TOKEN || !CHATWORK_ROOM_ID) {
  console.error("ERROR: CHATWORK_TOKEN and CHATWORK_ROOM_ID are required.");
  process.exit(1);
}

const app = express();

// Accept JSON and URL-encoded (Kuma can send either)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Main Kuma endpoint
app.post("/webhook/kuma", async (req, res) => {
  try {
    // Optional shared-secret check
    if (SHARED_SECRET) {
      const got = req.header("X-Adapter-Secret");
      if (!got || got !== SHARED_SECRET) {
        return res.status(401).json({ error: "unauthorized" });
      }
    }

    const payload = req.body || {};

    console.log("Received payload:", payload);

    const statusRaw =
      payload.status ??
      payload.state ??
      payload.heartbeat?.status ??
      payload.heartbeat?.status;

    const statusText =
      (typeof statusRaw === "string" && statusRaw.toLowerCase()) ||
      (statusRaw === 1 ? "UP" : statusRaw === 0 ? "DOWN" : String(statusRaw ?? "UNKNOWN").toUpperCase());

    const monitorName =
      payload.monitorName ??
      payload.monitor_name ??
      payload.monitor?.name ??
      payload.name ??
      "Unknown Monitor";

    const monitorUrl =
      payload.monitorURL ??
      payload.monitor_url ??
      payload.url ??
      payload.monitor?.url ??
      "";

    const ping = payload.ping ?? payload.heartbeat?.ping ?? undefined;
    const httpCode = payload.httpCode ?? payload.http_code ?? payload.heartbeat?.code ?? undefined;
    const time = payload.time ?? payload.heartbeat?.time ?? undefined;
    const duration = payload.duration ?? payload.heartbeat?.duration ?? undefined;
    const timezone = payload.heartbeat.timezone ?? undefined;
    const localTime = payload.heartbeat.localDateTime ?? undefined; 

    const suppliedMsg = payload.msg || payload.message;

    const lines = [];
    if (MESSAGE_PREFIX) lines.push(`${MESSAGE_PREFIX} ${statusText}`);
    else lines.push(`Status: ${statusText}`);

    lines.push(`Monitor: ${monitorName}`);
    if (monitorUrl) lines.push(`URL: ${monitorUrl}`);
    if (httpCode !== undefined) lines.push(`HTTP: ${httpCode}`);
    lines.push(`Ping: ${ping || "N/A"} ms`);
    if (duration !== undefined) lines.push(`Duration: ${duration}s`);
    if (localTime !== undefined) lines.push(`Time (${timezone || "local"}): ${localTime}`);

    if (suppliedMsg) {
      lines.push("");
      lines.push(suppliedMsg);
    }

    const body = lines.join("\n");

    const endpoint = `https://api.chatwork.com/v2/rooms/${encodeURIComponent(CHATWORK_ROOM_ID)}/messages`;
    await axios.post(
      endpoint,
      new URLSearchParams({ body }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-ChatWorkToken": CHATWORK_TOKEN
        },
        timeout: 10000
      }
    );

    // Respond to Kuma quickly
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Chatwork relay failed:", err?.response?.status, err?.response?.data || err.message);
    return res.status(500).json({ error: "relay_failed" });
  }
});

// Start
app.listen(PORT, () => {
  console.log(`Kuma→Chatwork adapter listening on :${PORT}`);
});