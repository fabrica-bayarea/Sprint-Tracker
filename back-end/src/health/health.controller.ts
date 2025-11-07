import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { HealthService } from './health.service';

@Controller('health-check')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'checa a saúde do serviço',
    description: 'Verifica se o serviço está funcionando corretamente',
  })
  @ApiResponse({ status: 200, description: 'Serviço saudável' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get()
  getHealth() {
    return this.healthService.getStatus();
  }
}
