import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneByMetamaskAddress(metamask_address: string) {
    return this.prisma.user.findUnique({
      where: { metamask_address },
      select: {
        id: true,
        metamask_address: true,
        last_login: true,
        total_wallets_created: true,
      },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        metamask_address: true,
        last_login: true,
        total_wallets_created: true,
      },
    });
  }

  // A method to update the user's last login
  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { last_login: new Date() },
    });
  }
}