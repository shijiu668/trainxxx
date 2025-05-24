import { defineStore } from 'pinia';
import { login, getUserInfo, logout } from '@/api/auth';
import router from '@/router';
import { ElMessage } from 'element-plus';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getUserInfo(),
    token: localStorage.getItem('token') || ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    hasRole: (state) => (role) => {
      return state.user && state.user.roles && state.user.roles.includes(role);
    },
    hasPermission: (state) => (permission) => {
      return state.user && state.user.permissions && state.user.permissions.includes(permission);
    }
  },
  actions: {
    async loginAction(credentials) {
      try {
        const response = await login(credentials);
        if (response.code === 200) {
          const { token, ...userInfo } = response.data;
          this.token = token;
          this.user = userInfo;
          
          // 存储到localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userInfo));
          
          // 登录成功，跳转到首页
          router.push('/');
          ElMessage.success('登录成功');
          return true;
        } else {
          ElMessage.error(response.message || '登录失败');
          return false;
        }
      } catch (error) {
        ElMessage.error(error.message || '登录失败');
        return false;
      }
    },
    logoutAction() {
      logout();
      this.token = '';
      this.user = {};
      router.push('/login');
      ElMessage.success('退出登录成功');
    }
  }
});