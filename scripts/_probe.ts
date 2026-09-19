const m = require('../.scratch/cnchar.order.js');
const { orders, strokeTable } = m.dict;
console.log('orders:', typeof orders, 'entries:', Object.keys(orders).length);
console.log('sample keys:', Object.keys(orders).slice(0, 10).join(','));
for (const k of ['一', '十', '人', '好', '想', '覆', '茶']) {
  console.log(k, '=>', JSON.stringify(orders[k]));
}
console.log('strokeTable:', JSON.stringify(strokeTable));
console.log('orderToWord:', typeof m.orderToWord, JSON.stringify(m.orderToWord('12345')));
