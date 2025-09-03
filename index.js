import express from "express";
import axios from "axios";
import "dotenv/config";

const PORT = process.env.PORT || 8080;
const CHATWORK_TOKEN = process.env.CHATWORK_TOKEN;
const CHATWORK_ROOM_ID = process.env.CHATWORK_ROOM_ID;
const SHARED_SECRET = process.env.SHARED_SECRET || null;

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

    // Debug log the incoming payload
    console.log("Received payload:", payload);

    const status = payload.heartbeat?.status ?? 0;
    const monitorName = payload.monitor?.name ?? "Unknown";

    const monitorUrl = payload.monitor?.url ?? "";
    const ping = payload.heartbeat?.ping ?? "N/A";
    const duration = payload.duration ?? payload.heartbeat?.duration ?? undefined;
    const timezone = payload.heartbeat.timezone ?? "local";
    const localTime = payload.heartbeat.localDateTime ?? undefined; 

    const heartbeatMsg = payload.heartbeat?.msg ?? "N/A";

    const lines = [];
    if (status === 1) {
      lines.push("[info][title]✅ Uptime Kuma Recovery[/title]");
      lines.push(`🟢 ${monitorName} is UP\n`);

      lines.push(`🌐 URL: ${monitorUrl}`);
      lines.push(`⏱ Ping: ${ping} ms`);
      if (duration !== undefined) lines.push(`🕒 Duration: ${duration}s`);
      if (localTime !== undefined) lines.push(`📍 Time (${timezone}): ${localTime}\n`);  

      lines.push("🎉 Status: Service has recovered and is now reachable");
      lines.push("[hr]");
      lines.push(`📝 Status code:`);
      lines.push(`[code]${heartbeatMsg}[/code]`);
      lines.push("[/info]");

    } else {
      lines.push("[info][title] 🚨 Uptime Kuma Alert[/title]");
      lines.push(`🔴 ${monitorName} is DOWN\n`);

      lines.push(`🌐 URL: ${monitorUrl}`);
      lines.push(`⏱ Ping: ${ping} ms`);
      if (duration !== undefined) lines.push(`🕒 Duration: ${duration}s`);
      if (localTime !== undefined) lines.push(`📍 Time (${timezone}): ${localTime}\n`);  

      lines.push("⚠️ Status: Service unreachable");
      lines.push("[hr]");
      lines.push(`📝 Error details:`);
      lines.push(`[code]${heartbeatMsg}[/code]`);
      lines.push("[/info]");
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