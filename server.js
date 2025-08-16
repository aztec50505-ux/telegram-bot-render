import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(express.json());
app.use(cors());

const TOKEN = process.env.TELEGRAM_TOKEN;
const DEFAULT_CHAT_ID = process.env.TARGET_CHAT_ID;
const API_KEY = process.env.SECRET_KEY;

app.post("/sendTelegram", async (req, res) => {
  if (API_KEY && req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { message, name, email, phone, chat_id, subject, source, ...rest } = req.body || {};
    const target = chat_id || DEFAULT_CHAT_ID;

    if (!TOKEN || !target) {
      return res.status(500).json({ ok: false, error: "server_not_configured" });
    }

    // format message
    const parts = [];
    if (subject) parts.push(`*${subject}*`);
    if (name) parts.push(`Name: ${name}`);
    if (email) parts.push(`Email: ${email}`);
    if (phone) parts.push(`Phone: ${phone}`);
    if (source) parts.push(`Source: ${source}`);
    if (message) parts.push(`Message:\n${message}`);
    const extras = Object.entries(rest).map(([k, v]) => `${k}: ${v}`).join("\n");
    if (extras) parts.push(extras);
    const text = parts.join("\n") || "(no content)";

    // send to Telegram
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: target,
      text,
      parse_mode: "Markdown",
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ ok: false, error: "send_failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
