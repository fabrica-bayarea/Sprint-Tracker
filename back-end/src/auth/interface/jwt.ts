export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  userName: string;

  // Claims padrão do JWT, preenchidas automaticamente ao assinar/decodificar
  iat?: number;
  exp?: number;
}
