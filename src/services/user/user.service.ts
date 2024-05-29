import { UserDocument } from '@/_domain/documents/user-role/user-role.document';
import { CollectionReference } from '@google-cloud/firestore';
import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid'

/**
 * Service for managing users.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(UserDocument.collectionName)
    private userCollection: CollectionReference<UserDocument>,
  ) {}

  /**
   * Creates or updates a user document.
   * 
   * @param {UserDocument} payload - The user data to upsert.
   * @returns {Promise<UserDocument | undefined>} A promise that resolves to the upserted UserDocument object or undefined if an error occurs.
   */
  async upsert(payload: UserDocument): Promise<UserDocument | undefined> {
    try {
      const userId = payload.userId || v4();
      const docRef = this.userCollection.doc(userId);
      await docRef.set({
        ...payload,
        userId,
        created: new Date().toISOString(),
      });
      const userDoc = await docRef.get();
      const user = userDoc.data();
      return user;
    } catch (error) {
      console.error('Error creating or updating document:', error);
      return undefined;
    }
  }

  /**
   * Retrieves all user documents.
   * 
   * @returns {Promise<UserDocument[]>} A promise that resolves to an array of UserDocument objects.
   */
  async findAll(): Promise<UserDocument[]> {
    try {
      const snapshot = await this.userCollection.get();
      const users: UserDocument[] = [];
      snapshot.forEach((doc) => users.push(doc.data() as UserDocument));
      return users;
    } catch (error) {
      console.error("Error retrieving all documents:", error);
      return [];
    }
  }

  /**
   * Retrieves a user document by its ID.
   * 
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<UserDocument | undefined>} A promise that resolves to the UserDocument object or undefined if not found or an error occurs.
   */
  async findOne(userId: string): Promise<UserDocument | undefined> {
    try {
      const docRef = this.userCollection.doc(userId);
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data() as UserDocument;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error("Error finding document:", error);
      return undefined;
    }
  }

  /**
   * Marks a user document as deleted by setting its delete field to true.
   * 
   * @param {string} userId - The ID of the user to mark as deleted.
   * @returns {Promise<UserDocument | undefined>} A promise that resolves to the updated UserDocument object or undefined if an error occurs.
   */
  async deleteOne(userId: string): Promise<UserDocument | undefined> {
    try {
      const docRef = this.userCollection.doc(userId);
      await docRef.update({
        deleted: true,
      });
      const userDoc = await docRef.get();
      const user = userDoc.data();
      return user;
    } catch (error) {
      console.error("Error setting delete field to true:", error);
      return undefined;
    }
  }
}
