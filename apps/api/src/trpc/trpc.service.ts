import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { AuthService } from '../auth/auth.service';
import type { TRPCContext } from '@medinest/trpc';
import type { Request, Response } from 'express';

@Injectable()
export class TRPCService {
  constructor(private readonly authService: AuthService) {}

  async createContext(req: Request, res: Response): Promise<TRPCContext> {
    const authHeader = req.headers.authorization;
    let user: TRPCContext['user'] = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      user = await this.authService.validateToken(token);
    }

    return { user, req, res };
  }
}
