import http from "node:http";
import { createTransport } from "nodemailer";

// Livro Archive email transport.
//
// Deliberately tiny and independently deployable: the Supabase `send-email` Edge
// Function renders the message and posts it here, this service only puts it on SMTP.
// Retries are the caller's job — the notification_events queue already owns that.

const PORT = Number(process.env.PORT ?? 8080);
const AUTH_TOKEN = process.env.EMAIL_SERVICE_TOKEN;
const FROM = process.env.SMTP_FROM ?? "Livro Archive <no-reply@livroarchive.com>";

const required = ["EMAIL_SERVICE_TOKEN", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Refusing to start — missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587 STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req, limitBytes = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true });
  }

  if (req.method !== "POST" || !req.url.startsWith("/send")) {
    return json(res, 404, { error: "Not found" });
  }

  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return json(res, 401, { error: "Unauthorized" });
  }

  let message;
  try {
    message = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: "Invalid JSON body" });
  }

  const { to, subject, text, html } = message;
  if (!to || !subject || (!text && !html)) {
    return json(res, 400, { error: "to, subject and text/html are required" });
  }

  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, text, html });
    console.log(JSON.stringify({ level: "info", event: "sent", to, subject, id: info.messageId }));
    return json(res, 200, { sent: true, messageId: info.messageId });
  } catch (error) {
    // Return 5xx so the caller's queue retries with backoff rather than dropping the mail.
    console.error(JSON.stringify({ level: "error", event: "send_failed", to, error: String(error) }));
    return json(res, 502, { error: "SMTP delivery failed" });
  }
});

server.listen(PORT, () => {
  console.log(`Livro Archive email service listening on :${PORT}`);
});
