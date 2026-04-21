// 清理本地存储中的旧管理员账号
const fs = require('fs');
const path = require('path');

// 模拟localStorage操作
class LocalStorage {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    return this.data[key] || null;
  }

  setItem(key, value) {
    this.data[key] = value;
  }

  removeItem(key) {
    delete this.data[key];
  }

  clear() {
    this.data = {};
  }
}

// 创建localStorage实例
const localStorage = new LocalStorage();

// 模拟读取本地存储数据
const usersData = localStorage.getItem('campus_book_users');
let users = [];

if (usersData) {
  try {
    users = JSON.parse(usersData);
    console.log('Current users:', users.map(user => user.username));
  } catch (error) {
    console.error('Error parsing users data:', error);
  }
}

// 移除旧的管理员账号
const filteredUsers = users.filter(user => user.username !== 'admin');

if (filteredUsers.length !== users.length) {
  console.log('Removed old admin account');
  localStorage.setItem('campus_book_users', JSON.stringify(filteredUsers));
  console.log('Updated users:', filteredUsers.map(user => user.username));
} else {
  console.log('No admin account found to remove');
}

// 移除登录状态
localStorage.removeItem('campus_book_login');
localStorage.removeItem('campus_book_user');

console.log('Local storage cleared for admin login');
console.log('Please restart the application and try to login again with admin/essgxlt666');
