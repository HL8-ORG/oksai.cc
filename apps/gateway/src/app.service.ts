import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; version: string } {
    return {
      message: 'Welcome to Oksai API Gateway',
      version: '0.0.1',
    };
  }
}
