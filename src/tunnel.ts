import WebSocket from 'ws';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

interface TunnelConfig {
  localUrl: string;
  localPort: number;
  serverUrl: string;
}

interface ConnectionInfo {
  publicUrl: string;
  localUrl: string;
  localPort: number;
  connected: boolean;
}

export class TunnelClient {
  private config: TunnelConfig;
  private ws: WebSocket | null = null;
  private connectionInfo: ConnectionInfo | null = null;
  private isConnected = false;
  private spinner: any;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.spinner = ora('Connecting to tunnel server...').start();
    
    try {
      await this.connectWebSocket();
      this.spinner.stop();
      this.showTunnelInfo();
      this.keepAlive();
      
    } catch (error: any) {
      this.spinner.fail(`Failed: ${error.message}`);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.spinner.text = 'Establishing connection...';

      // Build WebSocket URL with port parameter
      const wsProtocol = this.config.serverUrl.startsWith('https://') ? 'wss://' : 'ws://';
      const host = this.config.serverUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}${host}/_tunnel/ws/connect?port=${this.config.localPort}`;

      console.log(`Connecting to: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.isConnected = true;
        
        // Create connection info after successful connection
        this.connectionInfo = {
          publicUrl: this.config.serverUrl,
          localUrl: this.config.localUrl,
          localPort: this.config.localPort,
          connected: true
        };
        
        resolve();
      });

      this.ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
        } catch (error) {
          console.log(`Error handling message: ${error}`);
        }
      });

      this.ws.on('error', (error) => {
        this.spinner.fail(`Connection error: ${error.message}`);
        reject(error);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        if (this.connectionInfo) {
          this.connectionInfo.connected = false;
        }
        console.log(chalk.yellow('🔌 Tunnel connection closed'));
        
        // Auto-reconnect
        if (this.connectionInfo) {
          setTimeout(() => this.reconnect(), 5000);
        }
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          this.ws?.close();
          reject(new Error('Connection timeout - check server URL and network'));
        }
      }, 15000);
    });
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'http_request':
        await this.handleHttpRequest(message);
        break;
        
      case 'ping':
        this.sendMessage({ type: 'pong', timestamp: Date.now() });
        break;
        
      case 'error':
        console.log(chalk.red(`❌ Server error: ${message.error}`));
        break;
        
      default:
        console.log(chalk.gray(`📨 Unknown message: ${message.type}`));
    }
  }

  private async handleHttpRequest(message: any): Promise<void> {
    try {
      const { requestId, method, url, headers, body } = message;
      
      // Log incoming request
      console.log(`${method} ${url}`);

      // Forward to local service
      const localUrl = `${this.config.localUrl}${url}`;
      
      const response = await axios({
        method,
        url: localUrl,
        headers: headers || {},
        data: body,
        timeout: 30000,
        validateStatus: () => true // Accept all status codes
      });

      // Send response back
      this.sendMessage({
        type: 'http_response',
        requestId,
        statusCode: response.status,
        headers: response.headers,
        body: response.data
      });

    } catch (error: any) {
      console.log(`Local request failed: ${error.message}`);
      
      // Send error response
      this.sendMessage({
        type: 'http_response',
        requestId: message.requestId,
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Gateway - Local service unavailable' }
      });
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private showTunnelInfo(): void {
    if (!this.connectionInfo) return;

    console.log('\n' + chalk.cyan('🚇 Railway Tunnel Active!'));
    console.log(chalk.green('━'.repeat(50)));
    console.log(chalk.blue('Local URL:  ') + chalk.white(this.connectionInfo.localUrl));
    console.log(chalk.blue('Public URL: ') + chalk.white(this.connectionInfo.publicUrl));
    console.log(chalk.green('━'.repeat(50)));
    console.log(chalk.yellow('Press Ctrl+C to stop tunnel'));
    console.log('');
  }

  private keepAlive(): void {
    // Send periodic pings to keep connection alive
    setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }

  private async reconnect(): Promise<void> {
    if (this.isConnected) return;
    
    console.log(chalk.yellow('🔄 Attempting to reconnect...'));
    
    try {
      await this.connectWebSocket();
      console.log(chalk.green('✅ Reconnected successfully!'));
    } catch (error) {
      console.log(chalk.red('❌ Reconnection failed, retrying in 10 seconds...'));
      setTimeout(() => this.reconnect(), 10000);
    }
  }

  async close(): Promise<void> {
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
    }

    console.log(chalk.green('✅ Tunnel closed successfully'));
  }
}
