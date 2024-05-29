import * as admin from 'firebase-admin';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const FirebaseAdminProvider = 'FirebaseAdminProvider';
export const FirebaseAuthProvider = 'FirebaseAuthProvider';

export const createFirebaseAdminProvider = (configService: ConfigService): Provider => ({
  provide: FirebaseAdminProvider,
  useFactory: () => {
    return admin.initializeApp({
      credential: admin.credential.cert(configService.get<string>('SA_KEY')),
    });
  },
  inject: [ConfigService],
});

export const firebaseAuthProvider: Provider = {
  provide: FirebaseAuthProvider,
  useFactory: (app: admin.app.App) => app.auth(),
  inject: [FirebaseAdminProvider],
};
