import { Body, Controller, Get, UseGuards, Put, Delete } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { ProfileService } from '@/me/me.service';
import { AuthenticatedUser } from '@/types/user.interface';

import { updateProfileDto } from './dto/update-profile.dto';

@ApiCookieAuth()
@ApiTags('Perfil de usuário')
@Controller({ path: 'me', version: '1' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({
    summary: 'Perfil do usuário',
    description: 'Retorna as informações do usuário logado',
  })
  @ApiResponse({ status: 200, description: 'Perfil carregado com sucesso' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserProfile(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.profileService.getProfile(user.id);
    return profile;
  }

  @ApiOperation({
    summary: 'Atualiza o perfil do usuário',
    description: 'Atualiza as informações do usuário logado',
  })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: updateProfileDto,
  ) {
    await this.profileService.updateProfile(user.id, data);
    return { message: 'Perfil atualizado com sucesso.', data: data };
  }

  @ApiOperation({
    summary: 'Deleta a conta do usuário',
    description: 'Deleta a conta do usuário logado',
  })
  @ApiResponse({ status: 200, description: 'Perfil deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.profileService.deleteAccount(user.id);
    return { message: 'Conta deletada com sucesso.' };
  }

  @ApiOperation({
    summary: 'Retorna as notificações do usuário',
    description: 'Retorna as notificações do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificações carregadas com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    const notifications = await this.profileService.getNotifications(user.id);
    return notifications;
  }
}
