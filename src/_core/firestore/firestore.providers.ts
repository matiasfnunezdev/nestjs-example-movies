import { MovieDetailDocument } from "@/_domain/documents/movie-detail/movie-detail.document";
import { MovieDocument } from "@/_domain/documents/movie/movie.document";
import { UserDocument } from "@/_domain/documents/user-role/user-role.document";

export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions';
export const FirestoreCollectionProviders: string[] = [
  UserDocument.collectionName,
  MovieDocument.collectionName,
  MovieDetailDocument.collectionName
];
