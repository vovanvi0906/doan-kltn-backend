import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
@Dependencies(UsersRepository)
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async getProfile(userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId, updateDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.usersRepository.update(userId, updateDto);
  }

  async updateWorkerLocation(userId, lat, lng) {
    return this.usersRepository.updateWorkerLocation(userId, lat, lng);
  }
}
