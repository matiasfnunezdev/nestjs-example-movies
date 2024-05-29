import { LoginDto, RegisterDto } from '@/_domain/dto/auth.dto';
import { AuthService } from '@/services/auth/auth.service';
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
