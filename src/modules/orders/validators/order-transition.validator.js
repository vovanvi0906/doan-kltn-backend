import { BadRequestException } from '@nestjs/common';
import { VALID_STATUS_TRANSITIONS } from '../constants/order-status';

export class OrderTransitionValidator {
  static validateTransition(currentStatus, nextStatus) {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái đơn từ "${currentStatus}" sang "${nextStatus}". Trạng thái hợp lệ tiếp theo: [${allowedTransitions.join(
          ', ',
        )}]`,
      );
    }
    return true;
  }
}
