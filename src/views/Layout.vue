<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <el-header class="header">
      <div class="logo">
        <h1>校企合作实训管理系统</h1>
      </div>
      <div class="user-info">
        <span>{{ user.realName }}</span>
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link" style="cursor: pointer;">
            [切换]
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 侧边栏菜单 -->
      <el-aside width="220px" class="sidebar">
        <el-menu router :default-active="activeMenu" background-color="#304156" text-color="#bfcbd9"
          active-text-color="#409EFF">
          <el-menu-item index="/dashboard">
            <el-icon><el-icon-house /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <el-menu-item v-if="hasPermission('USER_VIEW')" index="/users">
            <el-icon><el-icon-user /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

          <el-menu-item v-if="hasPermission('USER_VIEW')" index="/roles">
            <el-icon><el-icon-key /></el-icon>
            <span>角色管理</span>
          </el-menu-item>

          <el-menu-item v-if="hasPermission('USER_VIEW')" index="/projects">
            <el-icon><el-icon-folder /></el-icon>
            <span>实训项目管理</span>
          </el-menu-item>

          <!-- 新增实训过程管理模块相关菜单 -->
          <el-sub-menu index="/training-process" v-if="hasPermission('USER_VIEW')">
            <template #title>
              <el-icon><el-icon-document /></el-icon>
              <span>实训过程管理</span>
            </template>
            <el-menu-item index="/tasks">
              <el-icon><el-icon-tickets /></el-icon>
              <span>任务管理</span>
            </el-menu-item>
            <el-menu-item index="/tasks/assigned-to-me">
              <el-icon><el-icon-message /></el-icon>
              <span>我的任务</span>
            </el-menu-item>
            <el-menu-item index="/submissions">
              <el-icon><el-icon-upload /></el-icon>
              <span>成果提交</span>
            </el-menu-item>
            <el-menu-item index="/task-evaluations">
              <el-icon><el-icon-star /></el-icon>
              <span>实训评价</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 企业资源管理菜单 -->
          <el-sub-menu index="/enterprises" v-if="hasPermission('USER_VIEW')">
            <template #title>
              <el-icon><el-icon-office-building /></el-icon>
              <span>企业资源管理</span>
            </template>

            <el-menu-item index="/enterprises">
              <el-icon><el-icon-tickets /></el-icon>
              <span>企业管理</span>
            </el-menu-item>
            <el-menu-item index="/enterprise-mentors">
              <el-icon><el-icon-message /></el-icon>
              <span>企业导师</span>
            </el-menu-item>
            <el-menu-item index="/project-templates">
              <el-icon><el-icon-upload /></el-icon>
              <span>项目库</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 教学资源管理菜单 -->
          <el-sub-menu index="/teaching-resources" v-if="hasPermission('USER_VIEW')">
            <template #title>
              <el-icon><el-icon-files /></el-icon>
              <span>教学资源管理</span>
            </template>
            <el-menu-item index="/teaching-resources">
              <el-icon><el-icon-message /></el-icon>
              <span>课程资源</span>
            </el-menu-item>
            <el-menu-item index="/teaching-resources?type=DOCUMENT">
              <el-icon><el-icon-upload /></el-icon>
              <span>教学文档</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 在Layout.vue的sidebar部分添加统计分析菜单 -->
          <el-menu-item v-if="hasPermission('USER_VIEW')" index="/statistics">
            <el-icon><el-icon-data-analysis /></el-icon>
            <span>统计分析</span>
          </el-menu-item>

        </el-menu>

      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="content">
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 计算当前激活的菜单
const activeMenu = computed(() => route.path);

// 获取用户信息
const user = computed(() => authStore.user);

// 判断是否有权限
const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logoutAction();
  }
};
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo h1 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
  color: #606266;
}

.main-container {
  height: calc(100vh - 60px);
}

.sidebar {
  background-color: #304156;
  color: #bfcbd9;
}

.content {
  padding: 20px;
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>