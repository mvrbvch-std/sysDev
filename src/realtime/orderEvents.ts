import { EventEmitter } from 'events';

export type OrderPaidEvent = {
  id: string;
  studentName: string;
  studentPhoto: string;
  items: string[];
  status: 'PENDING' | 'PREPARING' | 'READY';
};

export type OrderStatusEvent = {
  orderId: string;
  status: 'PENDING' | 'PREPARING' | 'READY';
};

class OrderEventBus extends EventEmitter {
  emitOrderPaid(payload: OrderPaidEvent) {
    this.emit('order:paid', payload);
  }

  emitOrderStatus(payload: OrderStatusEvent) {
    this.emit('order:status', payload);
  }
}

export const orderEvents = new OrderEventBus();
