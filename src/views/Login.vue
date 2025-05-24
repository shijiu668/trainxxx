<template>
    <div class="login-container">
      <div class="login-box">
        <div class="login-title">
          <h2>校企合作实训管理系统</h2>
        </div>
        <!-- 确保 ref 和 v-model 的引用正确 -->
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="el-icon-user"></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" placeholder="密码" prefix-icon="el-icon-lock" show-password></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 登录表单
  const loginForm = reactive({
    username: '',
    password: ''
  });
  
  // 表单校验规则
  const loginRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  };
  
  // 加载状态
  const loading = ref(false);
  const loginFormRef = ref(null);
  
  // 登录方法
  const handleLogin = async () => {
    try {
      // 添加一些调试信息
      console.log('点击登录按钮', loginForm);
      
      if (!loginFormRef.value) {
        console.error('表单引用不存在');
        return;
      }
      
      // 表单校验
      await loginFormRef.value.validate();
      
      // 显示加载状态
      loading.value = true;
      
      // 调用登录接口
      console.log('准备发送登录请求', loginForm);
      const result = await authStore.loginAction(loginForm);
      console.log('登录结果', result);
      
      if (result) {
        // 登录成功，如果有重定向路径，则跳转到该路径
        const redirectPath = route.query.redirect || '/';
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      // 隐藏加载状态
      loading.value = false;
    }
  };
  </script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
}

.login-box {
    width: 400px;
    padding: 30px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.login-title {
    text-align: center;
    margin-bottom: 30px;
}

.login-title h2 {
    font-size: 24px;
    color: #333;
}

.login-form {
    margin-bottom: 15px;
}

.login-button {
    width: 100%;
}

.login-tips {
    color: #999;
    font-size: 14px;
    text-align: center;
}

.login-tips p {
    margin: 5px 0;
}
</style>