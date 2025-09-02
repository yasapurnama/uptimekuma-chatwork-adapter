# Uptime Kuma → Chatwork Adapter

A lightweight Node.js service that acts as an **adapter** between
[Uptime Kuma](https://github.com/louislam/uptime-kuma) Webhook
notifications and [Chatwork](https://go.chatwork.com/) rooms.

When Uptime Kuma detects a monitor status change (UP/DOWN), this adapter
receives the webhook, formats a clean message, and posts it into your
Chatwork room.

------------------------------------------------------------------------

## ✨ Features

-   Receive Uptime Kuma webhook events (UP/DOWN, ping, HTTP code, etc.)
-   Normalize and format alerts into Chatwork messages
-   Secure with optional shared secret header
-   Docker-ready with multi-arch builds (amd64 + arm64)
-   Configurable message prefix

------------------------------------------------------------------------

## 📦 Installation

### 1. Clone repository

``` bash
git clone https://github.com/yasapurnama/uptimekuma-chatwork-adapter.git
cd uptimekuma-chatwork-adapter
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Setup environment

Create a `.env` file:

``` ini
# Required
CHATWORK_TOKEN=your_chatwork_api_token
CHATWORK_ROOM_ID=123456789

# Optional
SHARED_SECRET=supersecret
MESSAGE_PREFIX=[UptimeKuma]
PORT=8080
```

### 4. Run

``` bash
npm start
```

The service listens on `http://localhost:8080/webhook/kuma`.

------------------------------------------------------------------------

## 🐳 Docker

### Build & Run locally

``` bash
docker build -t uptimekuma-chatwork-adapter .
docker run --rm -p 8080:8080   -e CHATWORK_TOKEN=your_token   -e CHATWORK_ROOM_ID=123456789   -e MESSAGE_PREFIX="[UptimeKuma]"   uptimekuma-chatwork-adapter
```

### Multi-arch build & push to Docker Hub

``` bash
docker buildx build   --platform linux/amd64,linux/arm64   -t youruser/uptimekuma-chatwork-adapter:1.0.0   -t youruser/uptimekuma-chatwork-adapter:latest   --push .
```

------------------------------------------------------------------------

## ⚙️ Configuration

  ------------------------------------------------------------------------------------
  Variable                  Required       Default      Description
  ------------------------- -------------- ------------ ------------------------------
  `CHATWORK_TOKEN`          ✅ Yes         ---          Your Chatwork API token

  `CHATWORK_ROOM_ID`        ✅ Yes         ---          Room ID where messages will be
                                                        sent

  `PORT`                    ❌ No          `8080`       HTTP server port

  `SHARED_SECRET`           ❌ No          ---          If set, incoming requests must
                                                        include header
                                                        `X-Adapter-Secret: <secret>`

  `MESSAGE_PREFIX`          ❌ No          ---          Prefix added to each message
                                                        (e.g. `[UptimeKuma]`)
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 🔔 Uptime Kuma Setup

1.  In **Uptime Kuma**, go to **Settings → Notifications → Add New
    Notification → Webhook**.
2.  Set:
    -   **Post URL**: `https://your-adapter.example.com/webhook/kuma`

    -   **HTTP Method**: `POST`

    -   **Content Type**: `application/json`

    -   **Additional Header** (if you set secret):

            X-Adapter-Secret: your-secret

    -   **Custom Body** (recommended):

        ``` json
        {
          "status": {{status}},
          "monitorName": "{{monitor_name}}",
          "monitorURL": "{{monitor_url}}",
          "msg": "{{msg}}",
          "httpCode": {{http_code}},
          "ping": {{ping}},
          "time": {{timestamp}},
          "duration": {{down_duration}}
        }
        ```
3.  Test the notification → You should see the alert in Chatwork.

------------------------------------------------------------------------

## 🧪 Testing manually

Send a fake alert via `curl`:

``` bash
curl -X POST http://localhost:8080/webhook/kuma   -H "Content-Type: application/json"   -H "X-Adapter-Secret: supersecret"   -d '{
    "status": 0,
    "monitorName": "Homepage",
    "monitorURL": "https://example.com",
    "httpCode": 500,
    "ping": 1234,
    "msg": "Service DOWN detected by Kuma"
  }'
```

------------------------------------------------------------------------

## 📜 Example Chatwork Message

    [UptimeKuma] DOWN
    Monitor: Homepage
    URL: https://example.com
    HTTP: 500
    Ping: 1234 ms
    Time: 2025-09-02T12:34:56.000Z

    Service DOWN detected by Kuma

------------------------------------------------------------------------

## 🛡️ Security

-   Use `SHARED_SECRET` to reject unauthorized requests.
-   Run behind HTTPS (reverse proxy or ingress).
-   Use Docker non-root user (already configured in Dockerfile).

------------------------------------------------------------------------

## 🚀 Deployment

-   Deploy anywhere Docker runs (Kubernetes, ECS, Proxmox, bare metal).
-   Expose port `8080` and configure Kuma webhook accordingly.
-   Use `docker-compose` or Helm if deploying in a cluster.
