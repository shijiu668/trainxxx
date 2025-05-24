import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    if (response.status === 200) {
      return response.data;
    }
    
    // 否则的话抛出错误
    ElMessage.error(response.data.message || '系统异常');
    return Promise.reject(new Error(response.data.message || '系统异常'));
  },
  error => {
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
          ElMessage.error(error.response.data.message || '系统异常');
      }
    } else {
      ElMessage.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default request;