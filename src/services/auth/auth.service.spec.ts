import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FirebaseAuthProvider } from '@/_core/firebase/auth.providers';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from '@/_domain/dto/auth.dto';
import { BadRequestException } from '@nestjs/common';
import { auth } from 'firebase-admin';
import { getAuth, signInWithEmailAndPassword, UserCredential, User } from 'firebase/auth';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { initializeFirebase } from '@/_core/firebase/firebase-client';
import { FIREBASE_AUTH_URL } from '@/_core/config/firebase';
import { UserDocument, UserRoleType } from '@/_domain/documents/user-role/user-role.document';
import { UserRecord } from 'firebase-admin/auth';

jest.mock('firebase/auth');
jest.mock('axios');
jest.mock('@/_core/firebase/firebase-client', () => ({
  initializeFirebase: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockFirebaseAuth: jest.Mocked<auth.Auth>;
  let mockUserService: jest.Mocked<UserService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    mockFirebaseAuth = {
      createUser: jest.fn(),
      setCustomUserClaims: jest.fn(),
      revokeRefreshTokens: jest.fn(),
      createCustomToken: jest.fn(),
    } as unknown as jest.Mocked<auth.Auth>;

    mockUserService = {
      findOne: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'FIREBASE_API_KEY':
            return 'test-api-key';
          case 'FIREBASE_AUTH_DOMAIN':
            return 'test-auth-domain';
          case 'FIREBASE_PROJECT_ID':
            return 'test-project-id';
          case 'FIREBASE_STORAGE_BUCKET':
            return 'test-storage-bucket';
          case 'FIREBASE_MESSAGING_SENDER_ID':
            return 'test-sender-id';
          case 'FIREBASE_APP_ID':
            return 'test-app-id';
          default:
            return null;
        }
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseAuthProvider, useValue: mockFirebaseAuth },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      const mockUser: UserRecord = {
        uid: '1',
        email: 'test@example.com',
        emailVerified: false,
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        toJSON: jest.fn().mockReturnValue({}),
      } as unknown as UserRecord;

      mockFirebaseAuth.createUser.mockResolvedValue(mockUser);
      mockUserService.upsert.mockResolvedValue({ user: registerDto.email, userId: mockUser.uid, role: 'user' });

      const result = await authService.register(registerDto);
      expect(result).toEqual(mockUser);
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith(registerDto);
      expect(mockUserService.upsert).toHaveBeenCalledWith({
        user: registerDto.email,
        userId: mockUser.uid,
        role: 'user',
      });
    });

    it('should throw BadRequestException if registration fails', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      mockFirebaseAuth.createUser.mockRejectedValue(new Error('Registration error'));

      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

    it('should log in a user and return tokens', async () => {
      const mockUserCredential: UserCredential = {
        user: {
          uid: '12345',
          email: 'test@example.com',
        } as User,
        providerId: '',
        operationType: 'signIn',
      };

      const mockUser: UserDocument = { userId: '12345', role: 'user' as UserRoleType, created: new Date().toISOString() };
      const mockCustomToken = 'custom-token';
      const mockAxiosResponse = { data: { idToken: 'id-token', refreshToken: 'refresh-token' } };

      (initializeFirebase as jest.Mock).mockReturnValue({});
      (getAuth as jest.Mock).mockReturnValue({} as any);
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      mockUserService.findOne.mockResolvedValue(null);
      mockUserService.upsert.mockResolvedValue(mockUser);
      mockFirebaseAuth.setCustomUserClaims.mockResolvedValue();
      mockFirebaseAuth.revokeRefreshTokens.mockResolvedValue();
      mockFirebaseAuth.createCustomToken.mockResolvedValue(mockCustomToken);
      (axios.post as jest.Mock).mockResolvedValue(mockAxiosResponse);

      const result = await authService.login(loginDto);
      expect(result).toEqual(mockAxiosResponse.data);
      expect(initializeFirebase).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test-auth-domain',
        projectId: 'test-project-id',
        storageBucket: 'test-storage-bucket',
        messagingSenderId: 'test-sender-id',
        appId: 'test-app-id',
      });
      expect(getAuth).toHaveBeenCalledWith(expect.any(Object));
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), loginDto.email, loginDto.password);
      expect(mockUserService.findOne).toHaveBeenCalledWith('12345');
      expect(mockUserService.upsert).toHaveBeenCalledWith({ userId: '12345', role: 'user' });
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith('12345', { role: 'user' });
      expect(mockFirebaseAuth.revokeRefreshTokens).toHaveBeenCalledWith('12345');
      expect(mockFirebaseAuth.createCustomToken).toHaveBeenCalledWith('12345');
      expect(axios.post).toHaveBeenCalledWith(FIREBASE_AUTH_URL('test-api-key'), { token: mockCustomToken, returnSecureToken: true });
    });

    it('should throw BadRequestException if login fails', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Login error'));

      await expect(authService.login(loginDto)).rejects.toThrow(BadRequestException);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), loginDto.email, loginDto.password);
    });
  });
});
