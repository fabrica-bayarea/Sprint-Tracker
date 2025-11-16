import { validate } from 'class-validator';

import { Match } from '@/utils/match.decorator';

class TestMatchDto {
  public password!: string;

  @Match('password', {
    message: 'As senhas digitadas não coincidem!',
  })
  public confirmPassword!: string;
}

describe('MatchDecorator', () => {
  const DTO_SUCCESS_DATA = {
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const DTO_FAILURE_DATA = {
    password: 'Password123!',
    confirmPassword: 'PasswordInvalida',
  };

  it('should pass validation when properties match', async () => {
    const dto = new TestMatchDto();
    dto.password = DTO_SUCCESS_DATA.password;
    dto.confirmPassword = DTO_SUCCESS_DATA.confirmPassword;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when properties do not match', async () => {
    const dto = new TestMatchDto();
    dto.password = DTO_FAILURE_DATA.password;
    dto.confirmPassword = DTO_FAILURE_DATA.confirmPassword;

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('confirmPassword');
    expect(errors[0].constraints).toHaveProperty('match');
    expect(errors[0].constraints?.match).toBe(
      'As senhas digitadas não coincidem!',
    );
  });

  it('should use the default message when validationOptions is not provided', async () => {
    class TestDefaultMessageDto {
      public propA!: string;

      @Match('propA')
      public propB!: string;
    }

    const dto = new TestDefaultMessageDto();
    dto.propA = 'valor1';
    dto.propB = 'valor2'; // Vai falhar

    const errors = await validate(dto);

    expect(errors[0].constraints?.match).toBe('propB deve ser igual a propA');
  });
});
