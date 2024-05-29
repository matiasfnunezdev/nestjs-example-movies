import { MovieDetailDocument } from '@/_domain/documents/movie-detail/movie-detail.document';
import { CollectionReference } from '@google-cloud/firestore';
import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid'

/**
 * Service for managing movie details.
 */
@Injectable()
export class MovieDetailService {
  constructor(
    @Inject(MovieDetailDocument.collectionName)
    private movieDetailCollection: CollectionReference<MovieDetailDocument>,
  ) {}

  /**
   * Creates or updates a movie detail document.
   *
   * @param {MovieDetailDocument} payload - The movie detail data to upsert.
   * @returns {Promise<MovieDetailDocument | undefined>} A promise that resolves to the upserted MovieDetailDocument object or undefined if an error occurs.
   */
  async upsert(
    payload: MovieDetailDocument,
  ): Promise<MovieDetailDocument | undefined> {
    try {
      const movieId = payload.movieId || v4();
      const docRef = this.movieDetailCollection.doc(movieId);
      await docRef.set({
        ...payload,
        movieId,
        created: new Date().toISOString(),
      });
      const movieDetailDoc = await docRef.get();
      const movieDetail = movieDetailDoc.data();
      return movieDetail;
    } catch (error) {
      console.error('Error creating or updating document:', error);
      return undefined;
    }
  }

  /**
   * Retrieves all movie detail documents.
   *
   * @returns {Promise<MovieDetailDocument[]>} A promise that resolves to an array of MovieDetailDocument objects.
   */
  async findAll(): Promise<MovieDetailDocument[]> {
    try {
      const snapshot = await this.movieDetailCollection.get();
      const movieDetails: MovieDetailDocument[] = [];
      snapshot.forEach((doc) =>
        movieDetails.push(doc.data() as MovieDetailDocument),
      );
      return movieDetails;
    } catch (error) {
      console.error('Error retrieving all documents:', error);
      return [];
    }
  }

  /**
   * Retrieves a movie detail document by its ID.
   *
   * @param {string} movieId - The ID of the movie to retrieve.
   * @returns {Promise<MovieDetailDocument | undefined>} A promise that resolves to the MovieDetailDocument object or undefined if not found or an error occurs.
   */
  async findOne(movieId: string): Promise<MovieDetailDocument | undefined> {
    try {
      const docRef = this.movieDetailCollection.doc(movieId);
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data() as MovieDetailDocument;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error('Error finding document:', error);
      return undefined;
    }
  }

  /**
   * Marks a movie detail document as deleted by setting its delete field to true.
   *
   * @param {string} movieId - The ID of the movie to mark as deleted.
   * @returns {Promise<MovieDetailDocument | undefined>} A promise that resolves to the updated MovieDetailDocument object or undefined if an error occurs.
   */
  async deleteOne(movieId: string): Promise<MovieDetailDocument | undefined> {
    try {
      const docRef = this.movieDetailCollection.doc(movieId);
      await docRef.update({
        deleted: true,
      });
      const movieDetailDoc = await docRef.get();
      const movieDetail = movieDetailDoc.data();
      return movieDetail;
    } catch (error) {
      console.error('Error setting delete field to true:', error);
      return undefined;
    }
  }
}
