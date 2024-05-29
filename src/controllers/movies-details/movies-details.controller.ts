import { CreateMovieDetailDto } from '@/_core/interfaces/movie-detail/movie-detail.dto';
import { MovieDetailDocument } from '@/_domain/documents/movie-detail/movie-detail.document';
import { Roles } from '@/decorators/roles/roles.decorator';
import { MovieDetailService } from '@/services/movie-details/movie-details.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

/**
 * Controller for managing movie details.
 */
@Controller('movie-details')
export class MovieDetailController {
  constructor(
    private readonly movieDetailService: MovieDetailService,
  ) {}

  /**
   * Retrieves all movie details.
   *
   * @returns {Promise<MovieDetailDocument[]>} A promise that resolves to an array of MovieDetailDocument objects.
   */
  @Get()
  @Roles('user', 'admin')
  @HttpCode(200)
  async getAll(): Promise<MovieDetailDocument[]> {
    const result = await this.movieDetailService.findAll();
    return result;
  }

  /**
   * Retrieves a movie detail by its ID.
   *
   * @param {string} id - The ID of the movie detail to retrieve.
   * @returns {Promise<MovieDetailDocument>} A promise that resolves to the MovieDetailDocument object.
   */
  @Get(':id')
  @Roles('user', 'admin')
  @HttpCode(200)
  async getMovieDetail(@Param('id') id: string): Promise<MovieDetailDocument> {
    const result = await this.movieDetailService.findOne(id);
    if (!result) {
      throw new BadRequestException('Movie detail not found');
    }
    return result;
  }

  /**
   * Creates a new movie detail.
   *
   * @param {CreateMovieDetailDto} body - The movie detail data to create.
   * @returns {Promise<MovieDetailDocument>} A promise that resolves to the created MovieDetailDocument object.
   */
  @Post()
  @Roles('admin')
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() body: CreateMovieDetailDto): Promise<MovieDetailDocument> {
    const result = await this.movieDetailService.upsert(body);
    return result;
  }

  /**
   * Updates an existing movie detail.
   *
   * @param {string} id - The ID of the movie detail to update.
   * @param {CreateMovieDetailDto} body - The movie detail data to update.
   * @returns {Promise<MovieDetailDocument>} A promise that resolves to the updated MovieDetailDocument object.
   */
  @Put(':id')
  @Roles('admin')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() body: CreateMovieDetailDto,
  ): Promise<MovieDetailDocument> {
    const result = await this.movieDetailService.upsert({ ...body, movieId: id });
    return result;
  }

  /**
   * Deletes a movie detail by setting its delete field to true.
   *
   * @param {string} id - The ID of the movie detail to delete.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.movieDetailService.deleteOne(id);
    return;
  }
}
