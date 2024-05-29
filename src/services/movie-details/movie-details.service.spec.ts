import { Test, TestingModule } from '@nestjs/testing';
import { MovieDetailDocument } from '@/_domain/documents/movie-detail/movie-detail.document';
import { CollectionReference, Firestore } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';
import { MovieDetailService } from './movie-details.service';

jest.mock('@google-cloud/firestore');

describe('MovieDetailService', () => {
  let service: MovieDetailService;
  let collectionMock: jest.Mocked<CollectionReference<MovieDetailDocument>>;
  let firestoreMock: jest.Mocked<Firestore>;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    firestoreMock = new Firestore() as jest.Mocked<Firestore>;
    collectionMock = {
      doc: jest.fn().mockReturnThis(),
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      data: jest.fn(),
      exists: true,
    } as any;

    firestoreMock.collection = jest.fn().mockReturnValue(collectionMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieDetailService,
        {
          provide: MovieDetailDocument.collectionName,
          useValue: firestoreMock.collection(MovieDetailDocument.collectionName),
        },
      ],
    }).compile();

    service = module.get<MovieDetailService>(MovieDetailService);
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsert', () => {
    it('should create a new movie detail if movieId is not provided', async () => {
      const movieDetail: MovieDetailDocument = { title: 'Movie Title' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => ({ ...movieDetail, movieId: uuidv4(), created: new Date().toISOString() }) }),
      } as any);

      const result = await service.upsert(movieDetail);

      expect(result).toHaveProperty('movieId');
      expect(result).toHaveProperty('created');
    });

    it('should update an existing movie detail if movieId is provided', async () => {
      const movieDetail: MovieDetailDocument = { movieId: '123', title: 'Movie Title' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => movieDetail }),
      } as any);

      const result = await service.upsert(movieDetail);

      expect(result).toEqual(movieDetail);
    });

    it('should return undefined if there is an error', async () => {
      const movieDetail: MovieDetailDocument = { movieId: '123', title: 'Movie Title' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockRejectedValue(new Error('Error')),
        get: jest.fn().mockResolvedValue({ data: () => movieDetail }),
      } as any);

      const result = await service.upsert(movieDetail);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all movie details', async () => {
      const movieDetails: MovieDetailDocument[] = [
        { movieId: '1', title: 'Movie 1' },
        { movieId: '2', title: 'Movie 2' },
      ];
      collectionMock.get.mockResolvedValueOnce({
        forEach: (callback: Function) => movieDetails.forEach(movieDetail => callback({ data: () => movieDetail })),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(movieDetails);
    });

    it('should return an empty array if there is an error', async () => {
      collectionMock.get.mockRejectedValueOnce(new Error('Error'));

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a movie detail by movieId', async () => {
      const movieDetail: MovieDetailDocument = { movieId: '1', title: 'Movie 1' };
      collectionMock.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => movieDetail }),
      } as any);

      const result = await service.findOne('1');

      expect(result).toEqual(movieDetail);
    });

    it('should return undefined if movie detail not found', async () => {
      collectionMock.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ exists: false }),
      } as any);

      const result = await service.findOne('1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if there is an error', async () => {
      collectionMock.doc.mockReturnValueOnce({
        get: jest.fn().mockRejectedValue(new Error('Error')),
      } as any);

      const result = await service.findOne('1');

      expect(result).toBeUndefined();
    });
  });

  describe('deleteOne', () => {
    it('should mark a movie detail as deleted', async () => {
      const movieDetail: MovieDetailDocument = { movieId: '1', title: 'Movie 1', deleted: true };
      collectionMock.doc.mockReturnValueOnce({
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => movieDetail }),
      } as any);

      const result = await service.deleteOne('1');

      expect(result).toEqual(movieDetail);
    });

    it('should return undefined if there is an error', async () => {
      collectionMock.doc.mockReturnValueOnce({
        update: jest.fn().mockRejectedValue(new Error('Error')),
        get: jest.fn().mockResolvedValue({ data: () => ({ movieId: '1', title: 'Movie 1' }) }),
      } as any);

      const result = await service.deleteOne('1');

      expect(result).toBeUndefined();
    });
  });
});
