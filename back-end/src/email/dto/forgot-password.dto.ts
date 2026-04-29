import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'exemple@email.com' })
  @IsEmail({}, { message: 'Deve ser um email válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  @IsString({ message: 'O email deve ser uma string' })
  email!: string;
}
