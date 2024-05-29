export class MovieDetailDocument {
  static collectionName = 'movies-details';

  movieId?: string;
  title?: string;
  releaseDate?: string;
  director?: string;
  producer?: string;
  created?: string;
  deleted?: boolean
}
