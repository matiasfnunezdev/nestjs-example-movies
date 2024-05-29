import { IsString, IsOptional } from 'class-validator';

export class CreateMovieDetailDto {
  @IsOptional()
  @IsString()
  movieId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;

  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  producer?: string;

  @IsOptional()
  @IsString()
  created?: string;

  @IsOptional()
  @IsString()
  deleted?: boolean;
}
