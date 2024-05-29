import { Injectable, NestMiddleware, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { FirebaseAuthProvider } from '@/_core/firebase/auth.providers';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    @Inject(FirebaseAuthProvider) private readonly authService: auth.Auth,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }
    try {
      const decodedToken = await this.authService.verifyIdToken(token);
      req['user'] = decodedToken;
      next();
    } catch (error) {
      this.logger.error('Token Verification Error', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
