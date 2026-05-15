import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ example: 'Bug', description: 'Nome da label' })
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode estar vazio' })
  @MaxLength(32)
  name!: string;

  @ApiProperty({ example: '#ef4444', description: 'Cor hex (#RGB ou #RRGGBB)' })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Cor deve estar em formato hex (#RGB ou #RRGGBB)',
  })
  color!: string;
}
