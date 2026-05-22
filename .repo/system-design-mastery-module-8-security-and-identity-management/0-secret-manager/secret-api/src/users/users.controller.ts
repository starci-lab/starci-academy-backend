/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from "../entities";

/**
 * Class `UsersController` — thành phần lab (controller/service/module).
 * (EN: Class `UsersController` — lesson lab component.)
 */
export class UsersController implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Seed some data so the API returns something immediately
    const count = await this.userRepository.count();/**
 * Logic — Xử lý nghiệp vụ `if` cho lab.
 * Code — `if()` — logic trong service/controller.
 * (EN Logic: Business handler `if` for the lab.)
 * (EN Code: `if()` — in-class handler logic.)
 */
    if (count === 0) {
      await this.userRepository.save([
        { name: 'Admin StarCi' },
        { name: 'Học viên VIP' },
      ]);
    }
  }

  @Get()
  async findAll() {
    const users = await this.userRepository.find();
    return {
      status: 'success',
      data: users,
    };
  }
}
