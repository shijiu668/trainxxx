import request from './request';

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  });
}

export function getUserInfo() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}