import { AuthMiddleware } from './auth.middleware';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockAuthService: jest.Mocked<auth.Auth>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = {
      verifyIdToken: jest.fn(),
    } as unknown as jest.Mocked<auth.Auth>;

    middleware = new AuthMiddleware(mockAuthService);
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should throw UnauthorizedException if no token is provided', async () => {
    mockRequest.headers = {};

    await expect(middleware.use(mockRequest as Request, mockResponse as Response, mockNext)).rejects.toThrow(UnauthorizedException);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };
    mockAuthService.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

    await expect(middleware.use(mockRequest as Request, mockResponse as Response, mockNext)).rejects.toThrow(UnauthorizedException);
    expect(mockAuthService.verifyIdToken).toHaveBeenCalledWith('invalid-token');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next if token verification succeeds', async () => {
    const decodedToken: DecodedIdToken = {
      uid: '12345',
      aud: '',
      auth_time: 0,
      exp: 0,
      firebase: {
        identities: {},
        sign_in_provider: '',
      },
      iat: 0,
      iss: '',
      sub: '',
    };
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };
    mockAuthService.verifyIdToken.mockResolvedValue(decodedToken);

    await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockAuthService.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest['user']).toEqual(decodedToken);
    expect(mockNext).toHaveBeenCalled();
  });
});
