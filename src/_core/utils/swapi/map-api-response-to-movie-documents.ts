import { CreateMovieDto } from "@/_core/interfaces/movie/movie.dto";
import { FilmApiResponse } from "@/_core/interfaces/swapi/film.dto";

export function mapApiResponseToMovieDocuments(response: FilmApiResponse): CreateMovieDto[] {
  return response.results.map(film => {
    return {
      movieId: film.episode_id.toString(),
      title: film.title,
      created: film.created
    };
  });
}