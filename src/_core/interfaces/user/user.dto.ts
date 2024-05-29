// user.dto.ts
import { UserRoleType } from '@/_domain/documents/user-role/user-role.document';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: UserRoleType;
}
