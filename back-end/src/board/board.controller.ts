import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/strategy/decorators/current-user.decorator';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/types/user.interface';

@ApiCookieAuth()
@ApiTags('Quadros')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'boards', version: '1' })
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @ApiOperation({
    summary: 'Cria um novo quadro',
    description: 'Cria um novo quadro para o usuário autenticado',
  })
  @ApiResponse({ status: 201, description: 'Quadro criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao criar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBoardDto) {
    return this.boardService.create(user.id, dto);
  }

  @ApiOperation({
    summary: 'Busca todos os quadros do usuário autenticado',
    description: 'Busca todos os quadros do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Quadros encontrados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar os quadros' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return { data: this.boardService.findAll(user.id) };
  }

  @ApiOperation({
    summary: 'Busca um quadro específico',
    description: 'Busca um quadro específico pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Quadro encontrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.boardService.getBoardById(id, user.id);
  }

  @ApiOperation({
    summary: 'Atualiza um quadro específico',
    description: 'Atualiza um quadro específico pelo ID',
  })
  @ApiResponse({ status: 204, description: 'Quadro atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardService.update(id, user.id, dto);
  }

  @ApiOperation({
    summary: 'Remove um quadro específico',
    description: 'Remove um quadro específico pelo ID',
  })
  @ApiResponse({ status: 204, description: 'Quadro removido com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.boardService.remove(id, user.id);
  }
}
