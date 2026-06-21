import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'qltc-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
