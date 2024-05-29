import { MovieDocument } from '@/_domain/documents/movie/movie.document';
import { CollectionReference } from '@google-cloud/firestore';
import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid'

/**
 * Service for managing movies.
 */
@Injectable()
export class MovieService {
  constructor(
    @Inject(MovieDocument.collectionName)
    private movieCollection: CollectionReference<MovieDocument>,
  ) {}

  /**
   * Creates or updates a movie document.
   * 
   * @param {MovieDocument} payload - The movie data to upsert.
   * @returns {Promise<MovieDocument | undefined>} A promise that resolves to the upserted MovieDocument object or undefined if an error occurs.
   */
  async upsert(payload: MovieDocument): Promise<MovieDocument | undefined> {
    try {
      const movieId = payload.movieId || v4();
      const docRef = this.movieCollection.doc(movieId);
      await docRef.set({
        ...payload,
        movieId,
        created: new Date().toISOString(),
      });
      const movieDoc = await docRef.get();
      const movie = movieDoc.data();
      return movie;
    } catch (error) {
      console.error('Error creating or updating document:', error);
      return undefined;
    }
  }

  /**
   * Retrieves all movie documents.
   * 
   * @returns {Promise<MovieDocument[]>} A promise that resolves to an array of MovieDocument objects.
   */
  async findAll(): Promise<MovieDocument[]> {
    try {
      const snapshot = await this.movieCollection.get();
      const movies: MovieDocument[] = [];
      snapshot.forEach((doc) => movies.push(doc.data() as MovieDocument));
      return movies;
    } catch (error) {
      console.error("Error retrieving all documents:", error);
      return [];
    }
  }

  /**
   * Retrieves a movie document by its ID.
   * 
   * @param {string} movieId - The ID of the movie to retrieve.
   * @returns {Promise<MovieDocument | undefined>} A promise that resolves to the MovieDocument object or undefined if not found or an error occurs.
   */
  async findOne(movieId: string): Promise<MovieDocument | undefined> {
    try {
      const docRef = this.movieCollection.doc(movieId);
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data() as MovieDocument;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error("Error finding document:", error);
      return undefined;
    }
  }

  /**
   * Marks a movie document as deleted by setting its delete field to true.
   * 
   * @param {string} movieId - The ID of the movie to mark as deleted.
   * @returns {Promise<MovieDocument | undefined>} A promise that resolves to the updated MovieDocument object or undefined if an error occurs.
   */
  async deleteOne(movieId: string): Promise<MovieDocument | undefined> {
    try {
      const docRef = this.movieCollection.doc(movieId);
      await docRef.update({
        deleted: true,
      });
      const movieDoc = await docRef.get();
      const movie = movieDoc.data();
      return movie;
    } catch (error) {
      console.error("Error setting delete field to true:", error);
      return undefined;
    }
  }
}
