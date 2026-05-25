import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitVoteDto {
  @ApiProperty({
    example: ['1', '2', '3', '5', '8', '13', '21', '34'],
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({
    example: 'pokerSessionId',
  })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
