# Uptime Kuma → Chatwork Adapter

A lightweight Node.js service that acts as an **adapter** between
[Uptime Kuma](https://github.com/louislam/uptime-kuma) Webhook
notifications and [Chatwork](https://go.chatwork.com/) rooms.

When Uptime Kuma detects a monitor status change (UP/DOWN), this adapter
receives the webhook, formats a clean message, and posts it into your
Chatwork room.

------------------------------------------------------------------------

## 📥 Example

### Server is Down

![Server is Down](https://github.com/user-attachments/assets/b7688974-90c5-4509-a813-92be55a1c5e8)

### Server is Up

![Server is Up](https://github.com/user-attachments/assets/d8cdfd28-88a0-4b6f-b85f-e9028b06cdab)

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
PORT=8080
MENTION_USER_IDS=""
MENTION_ALL="false"
```

### 4. Run

``` bash
npm start
```

The service listens on `http://localhost:8080/webhook/kuma`.

------------------------------------------------------------------------

## 🐳 Docker

### Docker Hub

[![Docker Pulls](https://img.shields.io/docker/pulls/yasapurnama/uptimekuma-chatwork-adapter?style=flat-square)](https://hub.docker.com/r/yasapurnama/uptimekuma-chatwork-adapter)

```bash
docker run --rm -p 8080:8080 -e CHATWORK_TOKEN=your_token -e CHATWORK_ROOM_ID=123456789 yasapurnama/uptimekuma-chatwork-adapter:latest
```

### Build & Run locally

``` bash
docker build -t uptimekuma-chatwork-adapter .
docker run --rm -p 8080:8080 -e CHATWORK_TOKEN=your_token -e CHATWORK_ROOM_ID=123456789 uptimekuma-chatwork-adapter
```

### Multi-arch build & push to Docker Hub

``` bash
docker buildx build --platform linux/amd64,linux/arm64 -t youruser/uptimekuma-chatwork-adapter:1.0.0 -t youruser/uptimekuma-chatwork-adapter:latest --push .
```

------------------------------------------------------------------------

## ⚙️ Configuration

| Variable         | Required | Default | Description                                                                 |
|------------------|----------|---------|-----------------------------------------------------------------------------|
| `CHATWORK_TOKEN` | ✅ Yes   | ---     | Your Chatwork API token                                                     |
| `CHATWORK_ROOM_ID` | ✅ Yes | ---     | Room ID where messages will be sent                                         |
| `PORT`           | ❌ No (Optional)   | `8080`  | HTTP server port                                                            |
| `SHARED_SECRET`  | ❌ No (Optional)   | ---     | If set, incoming requests must include header `X-Adapter-Secret: <secret>`  |
| `MENTION_USER_IDS` | ❌ No (Optional) | ---     | Comma-separated user IDs to mention in messages (e.g. `123,456`)            |
| `MENTION_ALL`  | ❌ No (Optional)     | `false` | If `true`, mentions `@all` in messages (overrides `MENTION_USER_IDS`)       |

------------------------------------------------------------------------

## 🔔 Uptime Kuma Setup

1.  In **Uptime Kuma**, go to **Settings → Notifications → Add New
    Notification → Webhook**.
2.  Set:
    -   **Post URL**: `https://your-adapter.example.com/webhook/kuma`

    -   **HTTP Method**: `POST`

    -   **Content Type**: `application/json`

    -   **Additional Header** (if you set secret):

        ```
        {
          "X-Adapter-Secret": "your-shared-secret"
        }
        ```

3.  Test the notification → You should see the alert in Chatwork.

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
