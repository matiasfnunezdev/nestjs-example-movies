import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '@/services/auth/auth.service';
import { RegisterDto, LoginDto } from '@/_domain/dto/auth.dto';
import { UserRecord, UserMetadata } from 'firebase-admin/lib/auth/user-record'; // Import Firebase types

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'test123' };
      const result: UserRecord = {
        uid: '1',
        email: 'test@example.com',
        emailVerified: false,
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
          toJSON: () => ({ creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() }),
        },
        toJSON: () => ({
          uid: '1',
          email: 'test@example.com',
          emailVerified: false,
          disabled: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
            toJSON: () => ({ creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() }),
          },
        }),
        providerData: []
      };

      jest.spyOn(authService, 'register').mockImplementation(async () => result);

      expect(await authController.register(registerDto)).toBe(result);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'test123' };
      const result = { accessToken: 'some_token' };

      jest.spyOn(authService, 'login').mockImplementation(async () => result);

      expect(await authController.login(loginDto)).toBe(result);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
