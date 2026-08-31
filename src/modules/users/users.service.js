import { Injectable, Dependencies } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
@Dependencies(UsersRepository)
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findById(id) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email) {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmailOrPhone(identifier) {
    return this.usersRepository.findByEmailOrPhone(identifier);
  }

  async create(userData) {
    return this.usersRepository.create(userData);
  }

  async updateStatus(id, status) {
    return this.usersRepository.updateStatus(id, status);
  }
}
