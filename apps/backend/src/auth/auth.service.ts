import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@tempwallet/prisma';
import { verifyMessage } from 'ethers'; // or use viem

@Injectable()
export class AuthService {
  // Inject the JwtService and PrismaService
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // A constant message that the frontend will sign
  private readonly SIGN_MESSAGE = 'Welcome to TempwalletB! Please sign this message to authenticate, this will not cost you anything.';

  // This is the core authentication method
  async validateUser(metamask_address: string, signature: string): Promise<any> {
    try {
      // 1. Verify the signature
      const recoveredAddress = verifyMessage(this.SIGN_MESSAGE, signature);
      if (recoveredAddress.toLowerCase() !== metamask_address.toLowerCase()) {
        throw new UnauthorizedException('Signature verification failed.');
      }

      // 2. Upsert the user in the database
      const user = await this.prisma.user.upsert({
        where: { metamask_address: metamask_address.toLowerCase() },
        update: { last_login: new Date() },
        create: {
          metamask_address: metamask_address.toLowerCase(),
          last_login: new Date(),
        },
      });

      // 3. Generate and return a JWT
      const payload = { sub: user.id, metamask_address: user.metamask_address };
      return {
        access_token: this.jwtService.sign(payload),
      };

    } catch (error) {
      // Handle ethers signature verification errors
      console.error('Signature verification error:', error);
      throw new UnauthorizedException('Invalid signature or address.');
    }
  }
}