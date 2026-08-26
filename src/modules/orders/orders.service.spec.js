import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersRepository } from '../users/users.repository';

describe('OrdersService', () => {
  let service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            findByCustomerId: jest.fn(),
          },
        },
        {
          provide: OrderWorkflowService,
          useValue: {
            acceptOrder: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
