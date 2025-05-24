import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 获取 API 基础 URL - 优先使用环境变量，开发环境回退到本地
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

console.log('API Base URL:', API_BASE_URL); // 调试用，生产环境可以删除

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL + '/api', // 修改为使用环境变量
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    console.log('发送请求到:', config.baseURL + config.url); // 调试用，生产环境可以删除
    
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    ElMessage.error('请求发送失败');
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('收到响应:', response); // 调试用，生产环境可以删除
    
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    if (response.status === 200) {
      return response.data;
    }
    
    // 否则的话抛出错误
    ElMessage.error(response.data.message || '系统异常');
    return Promise.reject(new Error(response.data.message || '系统异常'));
  },
  error => {
    console.error('响应错误:', error); // 调试用，生产环境可以删除
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未登录或token过期
          ElMessage.error('未登录或登录过期，请重新登录');
          // 清除token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 跳转登录页面
          router.push('/login');
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error(error.response.data?.message || '系统异常');
      }
    } else if (error.code === 'NETWORK_ERROR') {
      ElMessage.error('网络连接失败，请检查网络设置');
    } else if (error.code === 'TIMEOUT') {
      ElMessage.error('请求超时，请稍后重试');
    } else {
      ElMessage.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default request;