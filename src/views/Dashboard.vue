<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>欢迎使用校企合作实训管理系统</h2>
          <p>当前登录角色：{{ roleNames }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="card-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>用户管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-user /></el-icon>
            </div>
            <div class="card-desc">
              <p>管理系统用户：学生、教师、企业导师和管理员</p>
              <el-button type="primary" size="small" @click="navigateTo('/users')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>角色管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-key /></el-icon>
            </div>
            <div class="card-desc">
              <p>管理系统角色及权限分配</p>
              <el-button type="primary" size="small" @click="navigateTo('/roles')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 企业资源管理卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>企业资源管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-office-building /></el-icon>
            </div>
            <div class="card-desc">
              <p>管理企业信息、企业导师和项目库</p>
              <el-button type="primary" size="small" @click="navigateTo('/enterprises')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 教学资源管理卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>教学资源管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-files /></el-icon>
            </div>
            <div class="card-desc">
              <p>管理课程资源和教学文档</p>
              <el-button type="primary" size="small" @click="navigateTo('/teaching-resources')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 实训项目管理卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>实训项目管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-folder /></el-icon>
            </div>
            <div class="card-desc">
              <p>管理实训项目创建、分配与评估</p>
              <el-button type="primary" size="small" @click="navigateTo('/projects')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 实训过程管理卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>实训过程管理</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-clock /></el-icon>
            </div>
            <div class="card-desc">
              <p>跟踪实训进度、日志和考勤管理</p>
              <el-button type="primary" size="small" @click="navigateTo('/tasks')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 统计分析卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>统计分析</h3>
            </div>
          </template>
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="40"><el-icon-data-analysis /></el-icon>
            </div>
            <div class="card-desc">
              <p>查看实训数据统计与分析</p>
              <el-button type="primary" size="small" @click="navigateTo('/statistics')"
                v-if="hasPermission('USER_VIEW')">进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

// 获取角色名称
const roleNames = computed(() => {
  if (!authStore.user.roles || authStore.user.roles.length === 0) {
    return '无角色';
  }
  return authStore.user.roles.map(role => {
    // 移除前缀 ROLE_
    return role.replace('ROLE_', '');
  }).join(', ');
});

// 判断是否有权限
const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

// 导航到指定路径
const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px 0;
}

.welcome-card {
  margin-bottom: 20px;
  text-align: center;
}

.welcome-card h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.welcome-card p {
  font-size: 16px;
  color: #606266;
}

.card-row {
  margin-top: 20px;
}

.dashboard-card {
  height: 180px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-header h3 {
  font-size: 16px;
  margin: 0;
}

.card-content {
  display: flex;
  height: 100%;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px;
  color: #409EFF;
}

.card-content {
  display: flex;
  height: 100%;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px;
  color: #409EFF;
}

.dashboard-card {
  height: 180px;
  margin-bottom: 20px;
  position: relative;
  /* 添加相对定位 */
}

.dashboard-card .el-button {
  position: absolute;
  /* 使用绝对定位 */
  bottom: 20px;
  /* 固定在底部，距离底部20px */
  left: 0;
  right: 0;
  margin: 0 auto;
  /* 水平居中 */
  width: calc(100% - 40px);
  /* 宽度为容器宽度减去左右边距 */
  z-index: 2;
  /* 增加层叠顺序 */
}

.dashboard-card p {
  position: absolute;
  /* 使用绝对定位 */
  top: 70px;
  /* 固定在顶部，根据实际情况调整 */
  left: 20px;
  right: 20px;
  margin: 0;
  z-index: 1;
  /* 设置层叠顺序 */
}
</style>