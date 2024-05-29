import { FirebaseAuthProvider } from '@/_core/firebase/auth.providers';
import { LoginDto, RegisterDto } from '@/_domain/dto/auth.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { auth } from 'firebase-admin';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { UserService } from '../user/user.service';
import { FIREBASE_AUTH_URL } from '@/_core/config/firebase';
import { ConfigService } from '@nestjs/config';
import { initializeFirebase } from '@/_core/firebase/firebase-client';

@Injectable()
export class AuthService {
  constructor(
    @Inject(FirebaseAuthProvider) private readonly firebaseAuth: auth.Auth,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const response = await this.firebaseAuth.createUser(registerDto);
      return response;
    } catch (error) {
      Logger.log('error', error);
      throw new BadRequestException(`Error: ${error}`);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const firebaseConfig = {
        apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
        authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID'),
        appId: this.configService.get<string>('FIREBASE_APP_ID'),
      };
      const firebase = initializeFirebase(firebaseConfig);
      const auth = getAuth(firebase);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginDto.email,
        loginDto.password,
      );
      const user = userCredential.user;
      let userData = await this.userService.findOne(user.uid);
      if (!userData) {
        userData = await this.userService.upsert({
          userId: user.uid,
          role: 'user',
        });
      }
      const customClaims = {
        role: userData.role,
      };
      await this.firebaseAuth.setCustomUserClaims(user.uid, customClaims);
      await this.firebaseAuth.revokeRefreshTokens(user.uid);
      const customToken = await this.firebaseAuth.createCustomToken(user.uid);
      const url = FIREBASE_AUTH_URL(firebaseConfig.apiKey);
      const response = await axios.post(url, {
        token: customToken,
        returnSecureToken: true,
      });
      return response.data;
    } catch (error) {
      Logger.log('error', error);
      throw new BadRequestException(`Error: ${error}`);
    }
  }
}
