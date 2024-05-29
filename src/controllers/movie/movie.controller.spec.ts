import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from '@/services/movie/movie.service';
import { MovieDetailService } from '@/services/movie-details/movie-details.service';
import { SwapiService } from '@/services/swapi/swapi.service';
import { CreateMovieDto } from '@/_core/interfaces/movie/movie.dto';
import { MovieDocument } from '@/_domain/documents/movie/movie.document';
import { BadRequestException } from '@nestjs/common';
import { Film } from '@/_core/interfaces/swapi/film.dto';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService: MovieService;
  let movieDetailService: MovieDetailService;
  let swapiService: SwapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [
        {
          provide: MovieService,
          useValue: {
            findOne: jest.fn(),
            upsert: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
        {
          provide: MovieDetailService,
          useValue: {
            upsert: jest.fn(),
          },
        },
        {
          provide: SwapiService,
          useValue: {
            getAllMovies: jest.fn(),
            getFilm: jest.fn(),
          },
        },
      ],
    }).compile();

    movieController = module.get<MovieController>(MovieController);
    movieService = module.get<MovieService>(MovieService);
    movieDetailService = module.get<MovieDetailService>(MovieDetailService);
    swapiService = module.get<SwapiService>(SwapiService);
  });

  it('should be defined', () => {
    expect(movieController).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all movies', async () => {
      const mockMovies: MovieDocument[] = [
        { movieId: '1', title: 'Movie 1' },
        { movieId: '2', title: 'Movie 2' },
      ];
      jest.spyOn(swapiService, 'getAllMovies').mockResolvedValue(mockMovies);

      expect(await movieController.getAll()).toBe(mockMovies);
      expect(swapiService.getAllMovies).toHaveBeenCalled();
    });
  });

  describe('getMovie', () => {
    it('should return a movie by id', async () => {
      const movieId = '1';
      const mockMovie: MovieDocument = { movieId, title: 'Movie 1' };
      jest.spyOn(movieService, 'findOne').mockResolvedValue(mockMovie);

      expect(await movieController.getMovie(movieId)).toBe(mockMovie);
      expect(movieService.findOne).toHaveBeenCalledWith(movieId);
    });

    it('should upsert movie details if not found locally but found in SWAPI', async () => {
      const movieId = '1';
      jest.spyOn(movieService, 'findOne').mockResolvedValue(null);
      const swapiResponse: Film = {
        title: 'SWAPI Movie',
        episode_id: 4,
        opening_crawl: 'A long time ago...',
        director: 'Director',
        producer: 'Producer',
        release_date: '2024-01-01',
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
        created: new Date().toISOString(),
        edited: new Date().toISOString(),
        url: 'http://swapi.dev/api/films/1/'
      };
      const upsertedMovie: MovieDocument = { movieId, title: 'SWAPI Movie' };
      jest.spyOn(swapiService, 'getFilm').mockResolvedValue(swapiResponse);
      jest.spyOn(movieService, 'upsert').mockResolvedValue(upsertedMovie);
      jest.spyOn(movieDetailService, 'upsert').mockResolvedValue(null);

      expect(await movieController.getMovie(movieId)).toBe(upsertedMovie);
      expect(movieService.upsert).toHaveBeenCalledWith({ title: 'SWAPI Movie' });
      expect(movieDetailService.upsert).toHaveBeenCalledWith({
        title: 'SWAPI Movie',
        director: 'Director',
        producer: 'Producer',
        releaseDate: '2024-01-01',
      });
    });

    it('should throw BadRequestException if movie not found locally or in SWAPI', async () => {
      const movieId = '1';
      jest.spyOn(movieService, 'findOne').mockResolvedValue(null);
      jest.spyOn(swapiService, 'getFilm').mockResolvedValue(null);

      await expect(movieController.getMovie(movieId)).rejects.toThrow(BadRequestException);
      expect(movieService.findOne).toHaveBeenCalledWith(movieId);
      expect(swapiService.getFilm).toHaveBeenCalledWith(movieId);
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto: CreateMovieDto = { title: 'New Movie' };
      const createdMovie: MovieDocument = { movieId: '1', title: 'New Movie' };
      jest.spyOn(movieService, 'upsert').mockResolvedValue(createdMovie);

      expect(await movieController.create(createMovieDto)).toBe(createdMovie);
      expect(movieService.upsert).toHaveBeenCalledWith(createMovieDto);
    });
  });

  describe('update', () => {
    it('should update an existing movie', async () => {
      const movieId = '1';
      const updateMovieDto: CreateMovieDto = { title: 'Updated Movie' };
      const updatedMovie: MovieDocument = { movieId, title: 'Updated Movie' };
      jest.spyOn(movieService, 'upsert').mockResolvedValue(updatedMovie);

      expect(await movieController.update(movieId, updateMovieDto)).toBe(updatedMovie);
      expect(movieService.upsert).toHaveBeenCalledWith({ ...updateMovieDto, movieId });
    });
  });

  describe('delete', () => {
    it('should delete a movie', async () => {
      const movieId = '1';
      jest.spyOn(movieService, 'deleteOne').mockResolvedValue(null);

      expect(await movieController.delete(movieId)).toBeUndefined();
      expect(movieService.deleteOne).toHaveBeenCalledWith(movieId);
    });
  });
});
