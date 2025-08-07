# 🚇 Rail Tunnel CLI

A professional tunneling solution that exposes your local development servers to the internet through secure WebSocket connections.

## ✨ Features

- **Secure Tunneling**: WebSocket-based connection with real-time request proxying
- **Easy Setup**: One command to expose any local service
- **Railway Integration**: Designed to work seamlessly with Railway's infrastructure
- **Real-time Logging**: Monitor all incoming requests and responses
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Installation
```bash
# Install globally
npm install -g rail-tunnel-cli

# Or use with npx (recommended)
npx rail-tunnel --help
```

### Basic Usage
```bash
# Tunnel your local development server
npx rail-tunnel tunnel --port 3000 --remote https://your-tunnel-server.railway.app

# Tunnel a different port
npx rail-tunnel tunnel --port 8080 --remote https://your-tunnel-server.railway.app

# For development/testing with local server
npx rail-tunnel tunnel --port 3000 --remote http://localhost:9000
```

## 📋 Commands

### `tunnel`
Create a secure tunnel to expose your local service to the internet.

**Required Options:**
- `-p, --port <port>` - Local port to tunnel (e.g., 3000, 8080)
- `-r, --remote <server>` - Tunnel server URL (e.g., https://my-tunnel.railway.app)

**Examples:**
```bash
# Tunnel local Next.js app (port 3000)
rail-tunnel tunnel --port 3000 --remote https://my-tunnel.railway.app

# Tunnel local API server (port 8080)
rail-tunnel tunnel --port 8080 --remote https://api-tunnel.railway.app

# Development testing with local tunnel server
rail-tunnel tunnel --port 3000 --remote http://localhost:9000
```

### `info`
Show system information and verify CLI installation.

```bash
rail-tunnel info
```

## 🗗️ Architecture

```
[Browser] → [Rail Tunnel Server] → [WebSocket] → [CLI Client] → [Local Service]
```

**Flow:**
1. CLI connects to tunnel server via WebSocket (`/_tunnel/ws/connect`)
2. Browser requests are sent to tunnel server public URL
3. Server forwards HTTP requests to CLI via WebSocket
4. CLI proxies requests to your local service
5. Responses are sent back through the same WebSocket connection
6. Browser receives the response as if it came directly from your local service

## 🔧 Development

### Setup
```bash
git clone https://github.com/isaui/rail-tunnel-cli.git
cd rail-tunnel-cli
npm install
```

### Development Mode
```bash
# Run from TypeScript source
npx ts-node src/cli.ts tunnel --port 3000 --remote http://localhost:9000

# Or use dev script
npm run dev tunnel --port 3000 --remote http://localhost:9000
```

### Build & Production
```bash
# Build TypeScript to JavaScript
npm run build

# Run production build
node dist/cli.js tunnel --port 3000 --remote https://your-server.railway.app
```

### Local Testing
```bash
# Terminal 1: Start your local app
npm run dev  # or python -m http.server 3000, etc.

# Terminal 2: Start tunnel server (for local testing)
cd ../rail-tunnel && go run main.go

# Terminal 3: Start tunnel client
npx ts-node src/cli.ts tunnel --port 3000 --remote http://localhost:9000

# Test: Open http://localhost:9000 in browser
```

## 🌐 Server Requirements

The CLI connects to a compatible Rail Tunnel server that implements:

### WebSocket Endpoints
- `WS /_tunnel/ws/connect?port=<port>` - WebSocket connection for tunnel client
- `GET /_tunnel/health` - Health check endpoint
- `GET /_tunnel/info` - Server information

### Traffic Proxying
- `ANY /*` - All other traffic is proxied through the tunnel to your local service

### WebSocket Message Protocol
```typescript
// Server → Client (HTTP Request)
{
  type: "http_request",
  requestId: string,
  method: string,
  url: string,
  headers: object,
  body: any
}

// Client → Server (HTTP Response)
{
  type: "http_response",
  requestId: string,
  statusCode: number,
  headers: object,
  body: any
}

// Client → Server (Keep-alive)
{
  type: "ping",
  timestamp: number
}

// Server → Client (Keep-alive response)
{
  type: "pong",
  timestamp: number
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related

- [Rail Tunnel Server](https://github.com/isaui/rail-tunnel) - The companion server application
- Deploy your own tunnel server on [Railway](https://railway.app)

## 🐛 Troubleshooting

### Connection Issues
**"Cannot reach server"**
- Ensure the tunnel server is deployed and accessible
- Verify server URL with `--remote` option
- Check if server health endpoint responds: `curl https://your-server.railway.app/_tunnel/health`

**"WebSocket connection timeout"**
- Check firewall/corporate network restrictions
- Try different network connection
- Verify WebSocket endpoint is accessible

### Local Service Issues
**"Local request failed"**
- Verify your local service is running on the specified port
- Test local accessibility: `curl http://localhost:3000`
- Check if the port is already in use by another application

**"502 Bad Gateway"**
- Local service is not responding
- Port mismatch between CLI and actual service
- Local service crashed or stopped

### General Issues
**CLI crashes or exits unexpectedly**
- Check Node.js version (requires Node 16+)
- Review error messages for specific issues
- Try running with `--verbose` flag if available

**Built with ❤️ for the Railway community**
