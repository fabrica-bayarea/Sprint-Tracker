import { IsNotEmpty, IsString } from 'class-validator';

export class LdapLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome de usuário não pode ser vazio.' })
  enrollment: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  password: string;
}
