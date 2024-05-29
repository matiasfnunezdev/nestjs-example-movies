import { Test, TestingModule } from '@nestjs/testing';
import { MovieDetailService } from '@/services/movie-details/movie-details.service';
import { CreateMovieDetailDto } from '@/_core/interfaces/movie-detail/movie-detail.dto';
import { MovieDetailDocument } from '@/_domain/documents/movie-detail/movie-detail.document';
import { BadRequestException } from '@nestjs/common';
import { MovieDetailController } from './movies-details.controller';

describe('MovieDetailController', () => {
  let movieDetailController: MovieDetailController;
  let movieDetailService: MovieDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieDetailController],
      providers: [
        {
          provide: MovieDetailService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            upsert: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
    }).compile();

    movieDetailController = module.get<MovieDetailController>(MovieDetailController);
    movieDetailService = module.get<MovieDetailService>(MovieDetailService);
  });

  it('should be defined', () => {
    expect(movieDetailController).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all movie details', async () => {
      const mockMovieDetails: MovieDetailDocument[] = [
        { movieId: '1', title: 'Detail 1' },
        { movieId: '2', title: 'Detail 2' },
      ];
      jest.spyOn(movieDetailService, 'findAll').mockResolvedValue(mockMovieDetails);

      expect(await movieDetailController.getAll()).toBe(mockMovieDetails);
      expect(movieDetailService.findAll).toHaveBeenCalled();
    });
  });

  describe('getMovieDetail', () => {
    it('should return a movie detail by id', async () => {
      const movieDetailId = '1';
      const mockMovieDetail: MovieDetailDocument = { movieId: movieDetailId, title: 'Detail 1' };
      jest.spyOn(movieDetailService, 'findOne').mockResolvedValue(mockMovieDetail);

      expect(await movieDetailController.getMovieDetail(movieDetailId)).toBe(mockMovieDetail);
      expect(movieDetailService.findOne).toHaveBeenCalledWith(movieDetailId);
    });

    it('should throw BadRequestException if movie detail not found', async () => {
      const movieDetailId = '1';
      jest.spyOn(movieDetailService, 'findOne').mockResolvedValue(null);

      await expect(movieDetailController.getMovieDetail(movieDetailId)).rejects.toThrow(BadRequestException);
      expect(movieDetailService.findOne).toHaveBeenCalledWith(movieDetailId);
    });
  });

  describe('create', () => {
    it('should create a new movie detail', async () => {
      const createMovieDetailDto: CreateMovieDetailDto = { title: 'New Detail' };
      const createdMovieDetail: MovieDetailDocument = { movieId: '1', title: 'New Detail' };
      jest.spyOn(movieDetailService, 'upsert').mockResolvedValue(createdMovieDetail);

      expect(await movieDetailController.create(createMovieDetailDto)).toBe(createdMovieDetail);
      expect(movieDetailService.upsert).toHaveBeenCalledWith(createMovieDetailDto);
    });
  });

  describe('update', () => {
    it('should update an existing movie detail', async () => {
      const movieDetailId = '1';
      const updateMovieDetailDto: CreateMovieDetailDto = { title: 'Updated Detail' };
      const updatedMovieDetail: MovieDetailDocument = { movieId: movieDetailId, title: 'Updated Detail' };
      jest.spyOn(movieDetailService, 'upsert').mockResolvedValue(updatedMovieDetail);

      expect(await movieDetailController.update(movieDetailId, updateMovieDetailDto)).toBe(updatedMovieDetail);
      expect(movieDetailService.upsert).toHaveBeenCalledWith({ ...updateMovieDetailDto, movieId: movieDetailId });
    });
  });

  describe('delete', () => {
    it('should delete a movie detail', async () => {
      const movieDetailId = '1';
      jest.spyOn(movieDetailService, 'deleteOne').mockResolvedValue(null);

      expect(await movieDetailController.delete(movieDetailId)).toBeUndefined();
      expect(movieDetailService.deleteOne).toHaveBeenCalledWith(movieDetailId);
    });
  });
});
