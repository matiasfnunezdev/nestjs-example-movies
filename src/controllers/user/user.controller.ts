import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from '@/services/user/user.service';
import { UserDocument } from '@/_domain/documents/user-role/user-role.document';
import { CreateUserDto } from '@/_core/interfaces/user/user.dto';
import { Roles } from '@/decorators/roles/roles.decorator';

/**
 * Controller for managing users.
 */
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  /**
   * Retrieves all users.
   * 
   * @returns {Promise<UserDocument[]>} A promise that resolves to an array of UserDocument objects.
   */
  @Get()
  @Roles('admin')
  @HttpCode(200)
  async getAll(): Promise<UserDocument[]> {
    const result = await this.userService.findAll();
    return result;
  }

  /**
   * Retrieves a user by its ID.
   * 
   * @param {string} id - The ID of the user to retrieve.
   * @returns {Promise<UserDocument>} A promise that resolves to the UserDocument object.
   */
  @Get(':id')
  @Roles('admin')
  @HttpCode(200)
  async getUser(@Param('id') id: string): Promise<UserDocument> {
    const result = await this.userService.findOne(id);
    return result;
  }

  /**
   * Creates a new user.
   * 
   * @param {CreateUserDto} body - The user data to create.
   * @returns {Promise<UserDocument>} A promise that resolves to the created UserDocument object.
   */
  @Post()
  @Roles('admin')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() body: CreateUserDto): Promise<UserDocument> {
    const result = await this.userService.upsert(body);
    return result;
  }

  /**
   * Updates an existing user.
   * 
   * @param {string} id - The ID of the user to update.
   * @param {CreateUserDto} body - The user data to update.
   * @returns {Promise<UserDocument>} A promise that resolves to the updated UserDocument object.
   */
  @Put(':id')
  @Roles('admin')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() body: CreateUserDto): Promise<UserDocument> {
    const result = await this.userService.upsert({ ...body, userId: id });
    return result;
  }

  /**
   * Deletes a user by setting its delete field to true.
   * 
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.userService.deleteOne(id);
    return;
  }
}
