import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Vou cuidar desse hoje.' })
  @IsString()
  @IsNotEmpty({ message: 'Comentário não pode estar vazio' })
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
