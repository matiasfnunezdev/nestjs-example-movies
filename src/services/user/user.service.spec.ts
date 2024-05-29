import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserDocument } from '@/_domain/documents/user-role/user-role.document';
import { CollectionReference, Firestore } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';

jest.mock('@google-cloud/firestore');

describe('UserService', () => {
  let service: UserService;
  let collectionMock: jest.Mocked<CollectionReference<UserDocument>>;
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
        UserService,
        {
          provide: UserDocument.collectionName,
          useValue: firestoreMock.collection(UserDocument.collectionName),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsert', () => {
    it('should create a new user if userId is not provided', async () => {
      const user: UserDocument = { role: 'user' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => ({ ...user, userId: uuidv4(), created: new Date().toISOString() }) }),
      } as any);

      const result = await service.upsert(user);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('created');
    });

    it('should update an existing user if userId is provided', async () => {
      const user: UserDocument = { userId: '123', role: 'user' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => user }),
      } as any);

      const result = await service.upsert(user);

      expect(result).toEqual(user);
    });

    it('should return undefined if there is an error', async () => {
      const user: UserDocument = { userId: '123', role: 'user' };
      collectionMock.doc.mockReturnValueOnce({
        set: jest.fn().mockRejectedValue(new Error('Error')),
        get: jest.fn().mockResolvedValue({ data: () => user }),
      } as any);

      const result = await service.upsert(user);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users: UserDocument[] = [{ userId: '1', role: 'user' }, { userId: '2', role: 'admin' }];
      collectionMock.get.mockResolvedValueOnce({
        forEach: (callback: Function) => users.forEach(user => callback({ data: () => user })),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(users);
    });

    it('should return an empty array if there is an error', async () => {
      collectionMock.get.mockRejectedValueOnce(new Error('Error'));

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by userId', async () => {
      const user: UserDocument = { userId: '1', role: 'user' };
      collectionMock.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => user }),
      } as any);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
    });

    it('should return undefined if user not found', async () => {
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
    it('should mark a user as deleted', async () => {
      const user: UserDocument = { userId: '1', role: 'user', deleted: true };
      collectionMock.doc.mockReturnValueOnce({
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => user }),
      } as any);

      const result = await service.deleteOne('1');

      expect(result).toEqual(user);
    });

    it('should return undefined if there is an error', async () => {
      collectionMock.doc.mockReturnValueOnce({
        update: jest.fn().mockRejectedValue(new Error('Error')),
        get: jest.fn().mockResolvedValue({ data: () => ({ userId: '1', role: 'user' }) }),
      } as any);

      const result = await service.deleteOne('1');

      expect(result).toBeUndefined();
    });
  });
});
