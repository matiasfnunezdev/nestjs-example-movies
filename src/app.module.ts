import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirestoreModule } from './_core/firestore/firestore.module';
import { AuthController } from './controllers/auth/auth.controller';
import { AuthService } from './services/auth/auth.service';
import { AuthModule } from './_core/firebase/auth.module';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';
import { UserService } from './services/user/user.service';
import { UserController } from './controllers/user/user.controller';
import { MovieService } from './services/movie/movie.service';
import { MovieController } from './controllers/movie/movie.controller';
import { SwapiService } from './services/swapi/swapi.service';
import { MovieDetailService } from './services/movie-details/movie-details.service';
import { MovieDetailController } from './controllers/movies-details/movies-details.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guard/roles/roles.guard';

@Module({
  imports: [
    HttpModule,
    FirestoreModule.forRoot({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        keyFilename: configService.get<string>('SA_KEY'),
      }),
      inject: [ConfigService],
    }),
    AuthModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    MovieController,
    MovieDetailController,
  ],
  providers: [
    AppService,
    AuthService,
    UserService,
    MovieService,
    SwapiService,
    MovieDetailService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
  ],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
