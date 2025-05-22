// Load environment variables first
import './config/env.js';

// Import dependencies
import { createApp } from './app.js';
import { FastifyInstance } from 'fastify';

// Create the Fastify application
const app = createApp();

// Server startup function with comprehensive error handling
async function startServer(): Promise<string> {
  try {
    // Log startup information
    console.log(`Starting server in ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} mode`);
    console.log('Environment variables loaded:', Object.keys(process.env).filter(key => 
      key === 'NODE_ENV' || 
      key.startsWith('CDP_') || 
      key.startsWith('ALCHEMY_')
    ));
    
    // Determine host and port
    // Use a very specific high-numbered port to avoid conflicts
    let port = 54321; // Explicitly override port to avoid conflicts with other processes
    const host = process.env.HOST || '0.0.0.0';
    
    console.log(`Attempting to start server on port ${port}...`);
    
    // Variable to store the server address
    let address = '';
    
    // Try to start the server with the configured port
    try {
      // Start the server with correct Fastify v5.3.3 syntax
      address = await app.listen({
        port: port,
        host: host
      });
      console.log(`Server is running at ${address}`);
    } catch (listenError) {
      if (listenError instanceof Error && listenError.message.includes('EADDRINUSE')) {
        // Port is in use, try alternative ports
        console.log(`Port ${port} is already in use, trying alternative ports...`);
        
        // Try a wider range of ports, including higher-numbered ports less likely to be in use
        let success = false;
        // Try ports in the range 3000-3010, 8080-8082, and 9000-9010
        const portRanges = [
          ...Array.from({ length: 10 }, (_, i) => 3000 + i + 1), // 3001-3010
          ...Array.from({ length: 3 }, (_, i) => 8080 + i),    // 8080-8082
          ...Array.from({ length: 11 }, (_, i) => 9000 + i)     // 9000-9010
        ];
        for (const alternativePort of portRanges) {
          try {
            console.log(`Attempting to use port ${alternativePort}...`);
            address = await app.listen({
              port: alternativePort,
              host: host
            });
            console.log(`Successfully started server on port ${alternativePort}`);
            console.log(`Server is running at ${address}`);
            success = true;
            break; // Break out of the loop if successful
          } catch (altError) {
            console.log(`Failed to use port ${alternativePort}`);
            // Continue to the next port
          }
        }
        
        if (!success) {
          throw new Error('Failed to start server on any available port');
        }
      } else {
        // If the error is not a port conflict, rethrow it
        throw listenError;
      }
    }
    
    // Log server information after successful startup
    console.log(`\n🚀 Server started successfully`);
    console.log(`   - Environment: ${process.env.NODE_ENV === 'development' ? 'development' : 'production'}`);
    console.log(`   - Node version: ${process.version}`);
    console.log(`   - API Documentation: ${address}/documentation\n`);
    
    return address;
  } catch (error) {
    console.error('\n❌ Fatal error during server startup:');
    
    if (error instanceof Error) {
      console.error(`   - Error: ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error('   - Stack trace:');
        console.error(error.stack.split('\n').slice(0, 3).map(line => `     ${line}`).join('\n') + '\n     ...');
      }
    } else {
      console.error('   - Unknown error:', error);
    }
    
    // Give logs time to flush before exiting
    setTimeout(() => process.exit(1), 100);
    return '';
  }
}

// Export the Fastify server for serverless environments
export const handler = app;

// Start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for use in tests or serverless environments
export default app;
