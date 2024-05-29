import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '@/services/user/user.service';
import { CreateUserDto } from '@/_core/interfaces/user/user.dto';
import { UserDocument } from '@/_domain/documents/user-role/user-role.document';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            upsert: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const mockUsers: UserDocument[] = [
        { userId: '1', role: 'user' },
        { userId: '2', role: 'admin' },
      ];
      jest.spyOn(userService, 'findAll').mockResolvedValue(mockUsers);

      expect(await userController.getAll()).toBe(mockUsers);
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      const mockUser: UserDocument = { userId, role: 'user' };
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      expect(await userController.getUser(userId)).toBe(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { role: 'user' };
      const createdUser: UserDocument = { userId: '1', role: 'user' };
      jest.spyOn(userService, 'upsert').mockResolvedValue(createdUser);

      expect(await userController.create(createUserDto)).toBe(createdUser);
      expect(userService.upsert).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const userId = '1';
      const updateUserDto: CreateUserDto = { role: 'admin' };
      const updatedUser: UserDocument = { userId, role: 'admin' };
      jest.spyOn(userService, 'upsert').mockResolvedValue(updatedUser);

      expect(await userController.update(userId, updateUserDto)).toBe(updatedUser);
      expect(userService.upsert).toHaveBeenCalledWith({ ...updateUserDto, userId });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = '1';
      jest.spyOn(userService, 'deleteOne').mockResolvedValue(null);

      expect(await userController.delete(userId)).toBeUndefined();
      expect(userService.deleteOne).toHaveBeenCalledWith(userId);
    });
  });
});
