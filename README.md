# 🚇 Rail Tunnel CLI

Ngrok-like tunnel CLI for Railway - **Hackathon Edition**

Expose your local services to the internet through Railway's infrastructure.

## 🚀 Quick Start

### Installation
```bash
npm install -g rail-tunnel-cli
# or use with npx (recommended)
npx rail-tunnel-cli --help
```

### Basic Usage
```bash
# Tunnel a local web server
npx rail-tunnel-cli tunnel http://localhost:3000

# Specify port explicitly  
npx rail-tunnel-cli tunnel http://localhost:8080 --port 8080

# Request custom subdomain
npx rail-tunnel-cli tunnel http://localhost:3000 --subdomain myapp

# Use custom Railway server
npx rail-tunnel-cli tunnel http://localhost:3000 --server https://my-tunnel-server.railway.app
```

## 📋 Commands

### `tunnel <url>`
Create a tunnel to expose local service to the internet.

**Options:**
- `-p, --port <port>` - Local port to tunnel (auto-detected from URL)
- `-s, --subdomain <subdomain>` - Request specific subdomain (optional)
- `--server <server>` - Railway server URL (default: your deployed server)
- `--auth <token>` - Authentication token (optional)

**Examples:**
```bash
rail-tunnel tunnel http://localhost:3000
rail-tunnel tunnel localhost:8080 --port 8080
rail-tunnel tunnel http://localhost:3000 --subdomain myapp
```

### `info`
Show system information and verify CLI installation.

```bash
rail-tunnel info
```

## 🏗️ Architecture

```
[Browser] → [Railway Server] → [WebSocket] → [CLI Client] → [Local Service]
```

**Flow:**
1. CLI connects to Railway server via WebSocket
2. Server assigns public URL (e.g., `abc123.railway.app`)
3. Public requests are forwarded to CLI via WebSocket
4. CLI forwards requests to local service
5. Responses are sent back through the same path

## 🔧 Development

### Setup
```bash
git clone <repo>
cd rail-tunnel-cli
npm install
```

### Development Mode
```bash
# Run from source
npm run dev tunnel http://localhost:3000

# Or use the bin script
./bin/rail-tunnel tunnel http://localhost:3000
```

### Build
```bash
npm run build
npm start tunnel http://localhost:3000
```

### Testing
```bash
# Start a local server
python -m http.server 8000
# or
npx serve -p 3000

# In another terminal, start tunnel
npm run dev tunnel http://localhost:8000
```

## 🌐 Server Requirements

The CLI connects to a Railway-deployed server that must implement:

### API Endpoints
- `POST /api/tunnels` - Create tunnel, return public URL
- `DELETE /api/tunnels/:id` - Close tunnel
- `GET /health` - Health check

### WebSocket Endpoint
- `WS /ws/tunnel/:tunnelId` - WebSocket connection for request forwarding

### Message Protocol
```typescript
// Client → Server
{
  type: "pong",
  timestamp: number
}

// Server → Client  
{
  type: "http_request",
  requestId: string,
  method: string,
  url: string,
  headers: object,
  body: any
}

// Client → Server
{
  type: "http_response", 
  requestId: string,
  statusCode: number,
  headers: object,
  body: any
}
```

## 🎯 Hackathon Features

**MVP Features (Phase 1):**
- ✅ CLI argument parsing
- ✅ WebSocket tunnel connection
- ✅ HTTP request forwarding
- ✅ Auto-reconnection
- ✅ Graceful shutdown
- ✅ Pretty terminal output

**Future Features (Phase 2):**
- 🔄 Custom subdomains
- 🔄 HTTPS support
- 🔄 Authentication
- 🔄 Multiple tunnel support
- 🔄 Traffic statistics
- 🔄 Web dashboard

## 🐛 Troubleshooting

### "Cannot reach server"
- Check if Railway server is deployed and accessible
- Verify server URL with `--server` option

### "WebSocket connection timeout"
- Check firewall/corporate network restrictions
- Try different network connection

### "Local service unavailable" 
- Verify local service is running on specified port
- Check local URL accessibility: `curl http://localhost:3000`

## 📝 License

MIT - Built for Railway Hackathon 🚀

## 🤝 Contributing

This is a hackathon project! Feel free to:
- Report bugs
- Submit feature requests  
- Send pull requests
- Star the repo ⭐

**Built with ❤️ for the Railway community**
