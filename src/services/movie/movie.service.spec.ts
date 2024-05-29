import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { MovieDocument } from '@/_domain/documents/movie/movie.document';
import { CollectionReference, DocumentReference, DocumentSnapshot } from '@google-cloud/firestore';
import * as uuid from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('MovieService', () => {
  let service: MovieService;
  let movieCollection: jest.Mocked<CollectionReference<MovieDocument>>;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    movieCollection = {
      doc: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<CollectionReference<MovieDocument>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        { provide: MovieDocument.collectionName, useValue: movieCollection },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  describe('upsert', () => {
    it('should create a new movie document if it does not exist', async () => {
      const movieId = 'movie-id';
      const movie: MovieDocument = { movieId, title: 'Test Movie' };
      const mockDocRef = {
        set: jest.fn(),
        get: jest.fn().mockResolvedValue({
          data: () => movie,
        } as DocumentSnapshot<MovieDocument>),
      } as unknown as jest.Mocked<DocumentReference<MovieDocument>>;

      (uuid.v4 as jest.Mock).mockReturnValue(movieId);
      movieCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.upsert({ title: 'Test Movie' });

      expect(result).toEqual(movie);
      expect(movieCollection.doc).toHaveBeenCalledWith(movieId);
      expect(mockDocRef.set).toHaveBeenCalledWith({
        ...movie,
        created: expect.any(String),
      });
      expect(mockDocRef.get).toHaveBeenCalled();
    });

    it('should handle errors and return undefined', async () => {
      const movieId = 'movie-id';
      movieCollection.doc.mockImplementation(() => {
        throw new Error('Firestore error');
      });

      (uuid.v4 as jest.Mock).mockReturnValue(movieId);

      const result = await service.upsert({ title: 'Test Movie' });

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should retrieve all movie documents', async () => {
      const movies: MovieDocument[] = [
        { movieId: '1', title: 'Movie 1' },
        { movieId: '2', title: 'Movie 2' },
      ];
      const mockSnapshot = {
        forEach: jest.fn((callback) => movies.forEach((movie) => callback({ data: () => movie }))),
      };

      movieCollection.get.mockResolvedValue(mockSnapshot as any);

      const result = await service.findAll();

      expect(result).toEqual(movies);
      expect(movieCollection.get).toHaveBeenCalled();
    });

    it('should handle errors and return an empty array', async () => {
      movieCollection.get.mockImplementation(() => {
        throw new Error('Firestore error');
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should retrieve a movie document by id', async () => {
      const movieId = '1';
      const movie: MovieDocument = { movieId, title: 'Test Movie' };
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => movie,
        } as DocumentSnapshot<MovieDocument>),
      } as unknown as jest.Mocked<DocumentReference<MovieDocument>>;

      movieCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.findOne(movieId);

      expect(result).toEqual(movie);
      expect(movieCollection.doc).toHaveBeenCalledWith(movieId);
      expect(mockDocRef.get).toHaveBeenCalled();
    });

    it('should return undefined if movie document does not exist', async () => {
      const movieId = '1';
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: false,
        } as DocumentSnapshot<MovieDocument>),
      } as unknown as jest.Mocked<DocumentReference<MovieDocument>>;

      movieCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.findOne(movieId);

      expect(result).toBeUndefined();
      expect(movieCollection.doc).toHaveBeenCalledWith(movieId);
      expect(mockDocRef.get).toHaveBeenCalled();
    });

    it('should handle errors and return undefined', async () => {
      const movieId = '1';
      movieCollection.doc.mockImplementation(() => {
        throw new Error('Firestore error');
      });

      const result = await service.findOne(movieId);

      expect(result).toBeUndefined();
    });
  });

  describe('deleteOne', () => {
    it('should mark a movie document as deleted', async () => {
      const movieId = '1';
      const movie: MovieDocument = { movieId, title: 'Test Movie', deleted: true };
      const mockDocRef = {
        update: jest.fn(),
        get: jest.fn().mockResolvedValue({
          data: () => movie,
        } as DocumentSnapshot<MovieDocument>),
      } as unknown as jest.Mocked<DocumentReference<MovieDocument>>;

      movieCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.deleteOne(movieId);

      expect(result).toEqual(movie);
      expect(movieCollection.doc).toHaveBeenCalledWith(movieId);
      expect(mockDocRef.update).toHaveBeenCalledWith({ deleted: true });
      expect(mockDocRef.get).toHaveBeenCalled();
    });

    it('should handle errors and return undefined', async () => {
      const movieId = '1';
      movieCollection.doc.mockImplementation(() => {
        throw new Error('Firestore error');
      });

      const result = await service.deleteOne(movieId);

      expect(result).toBeUndefined();
    });
  });
});
