import * as https from 'https';
import { Logger } from '@nestjs/common';

export class SSLConfig {
  private static readonly logger = new Logger(SSLConfig.name);

  /**
   * Configure HTTPS agent for iExec gateway connections
   * This handles SSL certificate issues in production environments
   */
  static configureHttpsAgent(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';

    if (isProduction && !rejectUnauthorized) {
      this.logger.warn('SSL certificate validation is disabled in production. This should be temporary.');
    }

    // Create custom HTTPS agent for iExec gateway
    const httpsAgent = new https.Agent({
      rejectUnauthorized: rejectUnauthorized,
      // Add additional SSL options if needed
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!SHA1:!AESCCM',
    });

    // Set as default agent for HTTPS requests
    https.globalAgent = httpsAgent;

    this.logger.log(`SSL configuration applied. Reject unauthorized: ${rejectUnauthorized}`);
  }
}