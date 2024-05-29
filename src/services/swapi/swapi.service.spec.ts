import { Test, TestingModule } from '@nestjs/testing';
import { SwapiService } from './swapi.service';
import { HttpService } from '@nestjs/axios';
import { MovieService } from '../movie/movie.service';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CreateMovieDto } from '@/_core/interfaces/movie/movie.dto';
import { Film, FilmApiResponse } from '@/_core/interfaces/swapi/film.dto';
import { MovieDocument } from '@/_domain/documents/movie/movie.document';
import { mapApiResponseToMovieDocuments } from '@/_core/utils/swapi/map-api-response-to-movie-documents';

jest.mock('@/_core/utils/swapi/map-api-response-to-movie-documents');

describe('SwapiService', () => {
  let service: SwapiService;
  let httpService: jest.Mocked<HttpService>;
  let movieService: jest.Mocked<MovieService>;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    movieService = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<MovieService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapiService,
        { provide: HttpService, useValue: httpService },
        { provide: MovieService, useValue: movieService },
      ],
    }).compile();

    service = module.get<SwapiService>(SwapiService);
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  describe('getFilms', () => {
    it('should return an array of CreateMovieDto', async () => {
      const filmApiResponse: FilmApiResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            title: 'A New Hope',
            episode_id: 4,
            opening_crawl: 'It is a period of civil war...',
            director: 'George Lucas',
            producer: 'Gary Kurtz, Rick McCallum',
            release_date: '1977-05-25',
            characters: [],
            planets: [],
            starships: [],
            vehicles: [],
            species: [],
            created: '2014-12-10T14:23:31.880000Z',
            edited: '2014-12-20T19:49:45.256000Z',
            url: 'https://swapi.dev/api/films/1/',
          },
        ],
      };

      const mockAxiosResponse: AxiosResponse<FilmApiResponse> = {
        data: filmApiResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      httpService.get.mockReturnValue(of(mockAxiosResponse));
      (mapApiResponseToMovieDocuments as jest.Mock).mockReturnValue([
        {
          title: 'A New Hope',
          movieId: '1',
          created: '2014-12-10T14:23:31.880000Z',
        },
      ]);

      const result = await service.getFilms();
      expect(result).toEqual([
        {
          title: 'A New Hope',
          movieId: '1',
          created: '2014-12-10T14:23:31.880000Z',
        },
      ]);
      expect(httpService.get).toHaveBeenCalledWith('https://swapi.dev/api/films/');
      expect(mapApiResponseToMovieDocuments).toHaveBeenCalledWith(filmApiResponse);
    });
  });

  describe('getFilm', () => {
    it('should return a Film', async () => {
      const film: Film = {
        title: 'A New Hope',
        episode_id: 4,
        opening_crawl: 'It is a period of civil war...',
        director: 'George Lucas',
        producer: 'Gary Kurtz, Rick McCallum',
        release_date: '1977-05-25',
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
        created: '2014-12-10T14:23:31.880000Z',
        edited: '2014-12-20T19:49:45.256000Z',
        url: 'https://swapi.dev/api/films/1/',
      };

      const mockAxiosResponse: AxiosResponse<Film> = {
        data: film,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      httpService.get.mockReturnValue(of(mockAxiosResponse));

      const result = await service.getFilm('1');
      expect(result).toEqual(film);
      expect(httpService.get).toHaveBeenCalledWith('https://swapi.dev/api/films//1');
    });

    it('should return undefined if the film is not found', async () => {
      httpService.get.mockReturnValue(of({} as AxiosResponse<Film>));

      const result = await service.getFilm('1');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllMovies', () => {
    it('should return an array of MovieDocument', async () => {
      const firestoreMovies: MovieDocument[] = [
        new MovieDocument('1', 'A New Hope', '2014-12-10T14:23:31.880000Z'),
      ];
      const swapiMovies: CreateMovieDto[] = [
        {
          movieId: '1',
          title: 'A New Hope',
          created: '2014-12-10T14:23:31.880000Z',
        },
      ];

      movieService.findAll.mockResolvedValue(firestoreMovies);
      jest.spyOn(service, 'getFilms').mockResolvedValue(swapiMovies);

      const result = await service.getAllMovies();
      expect(result).toEqual(firestoreMovies);
      expect(movieService.findAll).toHaveBeenCalled();
      expect(service.getFilms).toHaveBeenCalled();
    });

    it('should combine movies from Firestore and SWAPI', async () => {
      const firestoreMovies: MovieDocument[] = [
        new MovieDocument('1', 'A New Hope', '2014-12-10T14:23:31.880000Z'),
      ];
      const swapiMovies: CreateMovieDto[] = [
        {
          movieId: '2',
          title: 'The Empire Strikes Back',
          created: '2014-12-10T14:23:31.880000Z',
        },
      ];

      movieService.findAll.mockResolvedValue(firestoreMovies);
      jest.spyOn(service, 'getFilms').mockResolvedValue(swapiMovies);

      const result = await service.getAllMovies();

      // Sorting both arrays to ensure the order does not affect the test
      const sortedResult = result.sort((a, b) => a.movieId.localeCompare(b.movieId));
      const expected = [
        ...firestoreMovies,
        ...swapiMovies.map(dto => new MovieDocument(dto.movieId, dto.title, dto.created)),
      ].sort((a, b) => a.movieId.localeCompare(b.movieId));

      expect(sortedResult).toEqual(expected);
      expect(movieService.findAll).toHaveBeenCalled();
      expect(service.getFilms).toHaveBeenCalled();
    });
  });
});
