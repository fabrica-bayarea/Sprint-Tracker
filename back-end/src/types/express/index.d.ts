declare namespace Express {
  export interface Request {
    user?: import('@/auth/interfaces/jwt-payload.interface').ResetPasswordPayload;
  }
}
