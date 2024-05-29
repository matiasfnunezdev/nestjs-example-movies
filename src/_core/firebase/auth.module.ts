import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAdminProvider, FirebaseAuthProvider, firebaseAuthProvider } from './auth.providers';
import * as admin from 'firebase-admin';

@Global()
@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: FirebaseAdminProvider,
          useFactory: (configService: ConfigService) => {
            return admin.initializeApp({
              credential: admin.credential.cert(configService.get<string>('SA_KEY')),
            });
          },
          inject: [ConfigService],
        },
        firebaseAuthProvider,
      ],
      exports: [FirebaseAdminProvider, FirebaseAuthProvider],
    };
  }
}
