import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get('env')
  getEnv() {
    return { zerionApiKey: process.env.ZERION_API_KEY };
  }
}