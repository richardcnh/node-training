'use strict';

process.nextTick(function () {
  console.log('延迟执行');
});
console.log('正常执行');