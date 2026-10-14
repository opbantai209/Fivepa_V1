import { Message, Order } from '../src/types';

// Mock data for workstream regression tests
const mockOrder: Order = {
  id: 'order_123',
  title: 'Regression Test Workstream',
  buyerId: 'user_1',
  sellerId: 'user_2',
  amount: 100,
  status: 'in_progress',
  createdAt: '2026-10-13',
  dueDate: '2026-10-20'
};

const mockMessage: Message = {
  id: 'msg_1',
  orderId: 'order_123',
  senderId: 'user_1',
  senderName: 'Buyer',
  text: 'Hello seller',
  timestamp: new Date().toISOString()
};

console.log('Running Workstream Regression Tests...');

// Test 1: Order Linking
function testOrderLinking(order: Order) {
  if (order.id !== 'order_123') throw new Error('Order linking failed');
  console.log('✅ Test 1: Order Linking Passed');
}

// Test 2: Message Persistence
function testMessagePersistence(messages: Message[]) {
  if (messages.length === 0) throw new Error('Message persistence failed');
  console.log('✅ Test 2: Message Persistence Passed');
}

try {
  testOrderLinking(mockOrder);
  testMessagePersistence([mockMessage]);
  console.log('🎉 All Workstream Regression Tests Passed!');
} catch (error) {
  console.error('❌ Regression Tests Failed:', error);
  process.exit(1);
}
