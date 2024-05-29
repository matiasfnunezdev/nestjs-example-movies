import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreateMovieDto } from '@/_core/interfaces/movie/movie.dto';
import { Film, FilmApiResponse } from '@/_core/interfaces/swapi/film.dto';
import { mapApiResponseToMovieDocuments } from '@/_core/utils/swapi/map-api-response-to-movie-documents';
import { MovieService } from '../movie/movie.service';
import { MovieDocument } from '@/_domain/documents/movie/movie.document';

@Injectable()
export class SwapiService {
  private readonly swapiUrl = 'https://swapi.dev/api/films/';

  constructor(
    private readonly httpService: HttpService,
    private readonly movieService: MovieService,
  ) {}

  async getFilms(): Promise<CreateMovieDto[]> {
    const response = await firstValueFrom(
      this.httpService.get<FilmApiResponse>(this.swapiUrl),
    );
    return mapApiResponseToMovieDocuments(response.data);
  }

  async getFilm(id: string): Promise<Film | undefined> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Film>(`${this.swapiUrl}/${id}`),
      );
      return response.data;
    } catch {
      return undefined;
    }
  }

  async getAllMovies(): Promise<MovieDocument[]> {
    const firestoreMovies = await this.movieService.findAll();
    const swapiMovies = await this.getFilms();
  
    const unifiedMovies = swapiMovies.map((swapiMovie) => {
      const existingMovie = firestoreMovies.find(
        (movie) => movie.title === swapiMovie.title,
      );
      if (existingMovie) {
        return existingMovie;
      } else {
        return new MovieDocument(
          swapiMovie.movieId,
          swapiMovie.title,
          swapiMovie.created,
        );
      }
    });
  
    const additionalFirestoreMovies = firestoreMovies.filter(firestoreMovie => 
      !unifiedMovies.some(unifiedMovie => unifiedMovie.title === firestoreMovie.title)
    );
  
    return [...unifiedMovies, ...additionalFirestoreMovies];
  }
  
}
