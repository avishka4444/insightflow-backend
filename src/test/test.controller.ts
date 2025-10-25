import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('test')
export class TestController {
  constructor(private prisma: PrismaService) {}

  @Get('db')
  async testDatabase() {
    return this.prisma.user.findMany();
  }

  @Get('health')
  health() {
    return { status: 'ok', message: 'Prisma is connected to PostgreSQL' };
  }
}
