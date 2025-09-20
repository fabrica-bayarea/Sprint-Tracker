import { Request } from 'express';

export const jwtFromCookie = (req: Request) => {
  let token: string | null = null;
  if (req && req.cookies) {
    token = (req.cookies as Record<string, string>)['sprinttacker-session'];
  }
  return token;
};
