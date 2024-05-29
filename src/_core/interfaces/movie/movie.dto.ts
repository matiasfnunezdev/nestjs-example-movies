import { IsString, IsOptional } from 'class-validator';

export class CreateMovieDto {
  @IsOptional()
  @IsString()
  movieId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  created?: string;
}
