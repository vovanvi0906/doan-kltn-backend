import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
@Dependencies(ConfigService, UsersRepository)
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService, usersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('jwt.secret') ||
        process.env.JWT_SECRET ||
        'super-secret-jwt-key',
    });
    this.usersRepository = usersRepository;
  }

  async validate(payload) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc phiên đăng nhập hết hạn');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
