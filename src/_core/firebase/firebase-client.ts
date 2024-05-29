import * as admin from 'firebase-admin';
import 'firebase/auth';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { Logger } from '@nestjs/common';

export function initializeFirebase(firebaseConfig: Record<string, any>) {
  const apps = getApps();

  if (!apps.length) {
    initializeApp(firebaseConfig);
    Logger.log('Firebase initialized with the provided configuration');
  } else {
    Logger.log('Firebase app already initialized');
  }

  const firebase = getApp();
  return firebase;
}
