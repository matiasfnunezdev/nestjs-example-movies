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
import { MovieService } from '@/services/movie/movie.service';
import { MovieDocument } from '@/_domain/documents/movie/movie.document';
import { CreateMovieDto } from '@/_core/interfaces/movie/movie.dto';
import { SwapiService } from '@/services/swapi/swapi.service';
import { MovieDetailService } from '@/services/movie-details/movie-details.service';
import { Roles } from '@/decorators/roles/roles.decorator';

/**
 * Controller for managing movies.
 */
@Controller('movies')
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly movieDetailService: MovieDetailService,
    private readonly swapiService: SwapiService,
  ) {}

  /**
   * Retrieves all movies.
   *
   * @returns {Promise<MovieDocument[]>} A promise that resolves to an array of MovieDocument objects.
   */
  @Get()
  @Roles('user', 'admin')
  @HttpCode(200)
  async getAll(): Promise<MovieDocument[]> {
    const result = await this.swapiService.getAllMovies();
    return result;
  }

  /**
   * Retrieves a movie by its ID.
   *
   * @param {string} id - The ID of the movie to retrieve.
   * @returns {Promise<MovieDocument>} A promise that resolves to the MovieDocument object.
   */
  @Get(':id')
  @Roles('user', 'admin')
  @HttpCode(200)
  async getMovie(@Param('id') id: string): Promise<MovieDocument> {
    let result = await this.movieService.findOne(id);
    if (!result) {
      const swapiResponse = await this.swapiService.getFilm(id);
      if (!swapiResponse) {
        throw new BadRequestException('Movie not found');
      } else {
        result = await this.movieService.upsert({
          title: swapiResponse.title,
        });
        await this.movieDetailService.upsert({
          title: swapiResponse.title,
          director: swapiResponse.director,
          producer: swapiResponse.producer,
          releaseDate: swapiResponse.release_date,
        });
      }
    }
    return result;
  }

  /**
   * Creates a new movie.
   *
   * @param {CreateMovieDto} body - The movie data to create.
   * @returns {Promise<MovieDocument>} A promise that resolves to the created MovieDocument object.
   */
  @Post()
  @Roles('admin')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() body: CreateMovieDto): Promise<MovieDocument> {
    const result = await this.movieService.upsert(body);
    return result;
  }

  /**
   * Updates an existing movie.
   *
   * @param {string} id - The ID of the movie to update.
   * @param {CreateMovieDto} body - The movie data to update.
   * @returns {Promise<MovieDocument>} A promise that resolves to the updated MovieDocument object.
   */
  @Put(':id')
  @Roles('admin')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() body: CreateMovieDto,
  ): Promise<MovieDocument> {
    const result = await this.movieService.upsert({ ...body, movieId: id });
    return result;
  }

  /**
   * Deletes a movie by setting its delete field to true.
   *
   * @param {string} id - The ID of the movie to delete.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.movieService.deleteOne(id);
    return;
  }
}
