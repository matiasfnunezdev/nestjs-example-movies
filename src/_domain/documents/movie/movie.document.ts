export class MovieDocument {
  static collectionName = 'movies';

  movieId?: string;
  title?: string;
  created?: string;
  deleted?: boolean

  constructor(movieId?: string, title?: string, created?: string, deleted?: boolean) {
    this.movieId = movieId;
    this.title = title;
    this.created = created;
    this.deleted = deleted
  }
}
