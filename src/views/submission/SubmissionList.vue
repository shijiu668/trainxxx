<template>
    <div class="submission-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>成果提交列表</h3>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索提交标题" clearable @clear="fetchSubmissions" @keyup.enter="searchSubmissions">
            <template #append>
              <el-button @click="searchSubmissions">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="提交状态" clearable @change="fetchSubmissions">
            <el-option label="待审核" :value="0"></el-option>
            <el-option label="已通过" :value="1"></el-option>
            <el-option label="未通过" :value="2"></el-option>
          </el-select>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredSubmissions" v-loading="loading" border style="width: 100%">
          <el-table-column prop="title" label="提交标题" min-width="150" />
          <el-table-column label="相关任务" min-width="150">
            <template #default="scope">
              <router-link :to="`/tasks/${scope.row.taskId}`">
                {{ scope.row.task ? scope.row.task.title : '未知任务' }}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column label="提交者" width="120">
            <template #default="scope">
              {{ scope.row.user ? scope.row.user.realName : '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getSubmissionStatusType(scope.row.status)">
                {{ getSubmissionStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="150">
            <template #default="scope">
              {{ formatDateTime(scope.row.submittedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleViewSubmission(scope.row)">查看</el-button>
              <el-button 
                v-if="hasPermission('USER_EDIT') && scope.row.status === 0" 
                type="success" 
                size="small" 
                @click="handleUpdateStatus(scope.row, 1)">
                通过
              </el-button>
              <el-button 
                v-if="hasPermission('USER_EDIT') && scope.row.status === 0" 
                type="danger" 
                size="small" 
                @click="handleUpdateStatus(scope.row, 2)">
                驳回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  import { getSubmissions, updateSubmissionStatus } from '@/api/submission';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 数据
  const submissions = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterStatus = ref('');
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 根据搜索条件过滤提交列表
  const filteredSubmissions = computed(() => {
    if (!searchQuery.value && filterStatus.value === '') {
      return submissions.value;
    }
    
    return submissions.value.filter(submission => {
      const titleMatch = !searchQuery.value || 
                       submission.title.toLowerCase().includes(searchQuery.value.toLowerCase());
      const statusMatch = filterStatus.value === '' || 
                         submission.status === filterStatus.value;
      return titleMatch && statusMatch;
    });
  });
  
  // 获取提交列表
  const fetchSubmissions = async () => {
    loading.value = true;
    try {
      const response = await getSubmissions();
      if (response.code === 200) {
        submissions.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取提交列表失败');
      }
    } catch (error) {
      console.error('获取提交列表失败:', error);
      ElMessage.error('获取提交列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 搜索提交
  const searchSubmissions = () => {
    fetchSubmissions();
  };
  
  // 查看提交详情
  const handleViewSubmission = (row) => {
    router.push(`/submissions/${row.id}`);
  };
  
  // 更新提交状态
  const handleUpdateStatus = async (row, status) => {
    try {
      const response = await updateSubmissionStatus(row.id, status);
      if (response.code === 200) {
        ElMessage.success('状态更新成功');
        fetchSubmissions();
      } else {
        ElMessage.error(response.message || '状态更新失败');
      }
    } catch (error) {
      console.error('更新提交状态失败:', error);
      ElMessage.error('更新提交状态失败');
    }
  };
  
  // 格式化日期时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // 获取提交状态标签
  const getSubmissionStatusLabel = (status) => {
    const statusMap = {
      0: '待审核',
      1: '已通过',
      2: '未通过'
    };
    return statusMap[status] || '未知';
  };
  
  // 获取提交状态类型
  const getSubmissionStatusType = (status) => {
    const typeMap = {
      0: 'info',
      1: 'success',
      2: 'danger'
    };
    return typeMap[status] || '';
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchSubmissions();
  });
  </script>
  
  <style scoped>
  .submission-list {
    padding: 20px 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h3 {
    margin: 0;
  }
  
  .search-bar {
    display: flex;
    margin-bottom: 20px;
    gap: 10px;
  }
  
  .search-bar .el-input {
    width: 300px;
  }
  </style>