#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { TunnelClient } from './tunnel';

const program = new Command();

// CLI Info
program
  .name('rail-tunnel')
  .description('🚇 Rail Tunnel - Ngrok-like tunneling service (Hackathon Edition)')
  .version('1.0.0');

// Main tunnel command
program
  .command('tunnel')
  .description('Create a tunnel to expose local service to the internet')
  .requiredOption('-p, --port <port>', 'Local port to tunnel (e.g., 3000, 8080)')
  .requiredOption('-r, --remote <server>', 'Rail Tunnel server URL (e.g., https://my-tunnel.railway.app)')
  .action(async (options: any) => {
    try {
      console.log(chalk.cyan('Rail Tunnel - Hackathon Edition'));
      console.log(chalk.gray(`Tunneling localhost:${options.port} -> Rail Tunnel`));
      
      // Validate port
      const port = parseInt(options.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.log(chalk.red('Invalid port number'));
        console.log(chalk.yellow('Example: rail-tunnel tunnel --port 3000'));
        process.exit(1);
      }

      // Build local URL
      const localUrl = `http://localhost:${port}`;

      // Create tunnel client
      const tunnel = new TunnelClient({
        localUrl,
        localPort: port,
        serverUrl: options.remote
      });

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow(' Shutting down tunnel...'));
        await tunnel.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await tunnel.close();
        process.exit(0);
      });

      // Start tunnel
      await tunnel.start();
      
    } catch (error: any) {
      console.log(chalk.red(` Error: ${error.message}`));
      process.exit(1);
    }
  });

// Info command for debugging
program
  .command('info')
  .description('Show system information')
  .action(() => {
    console.log(chalk.cyan('Railway Tunnel CLI Info'));
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(chalk.green('CLI is working!'));
  });

// Help examples
program.on('--help', () => {
  console.log('\nExamples:');
  console.log('  $ rail-tunnel tunnel --port 3000 --remote https://my-app.railway.app');
  console.log('  $ rail-tunnel tunnel --port 8080 --remote https://my-api.railway.app');
  console.log('  $ rail-tunnel info');
  console.log('\nNote: Each Railway deployment handles one tunnel. Deploy multiple times for multiple tunnels.');
});

// Parse CLI arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
