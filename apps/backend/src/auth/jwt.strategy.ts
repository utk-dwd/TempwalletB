import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@tempwallet/prisma';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; metamask_address: string }) {
    // Look up the user by ID and metamask_address
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
        metamask_address: payload.metamask_address,
      },
      select: {
        id: true,
        metamask_address: true,
        last_login: true,
        total_wallets_created: true,
      },
    });

    if (!user) {
      // The user doesn't exist in the database, even though the token is valid
      return null;
    }

    // This user object will be attached to the request object (req.user)
    return user;
  }
}