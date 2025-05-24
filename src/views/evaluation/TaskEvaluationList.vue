<template>
    <div class="evaluation-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>实训评价列表</h3>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索评价内容" clearable @clear="fetchEvaluations" @keyup.enter="searchEvaluations">
            <template #append>
              <el-button @click="searchEvaluations">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterMode" placeholder="评价模式" clearable @change="fetchEvaluations">
            <el-option label="我的评价" value="my-evaluations"></el-option>
            <el-option label="收到的评价" value="received-evaluations"></el-option>
            <el-option label="所有评价" value="all"></el-option>
          </el-select>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredEvaluations" v-loading="loading" border style="width: 100%">
          <el-table-column label="提交标题" min-width="150">
            <template #default="scope">
              <router-link :to="`/submissions/${scope.row.submissionId}`">
                {{ scope.row.submission ? scope.row.submission.title : '未知提交' }}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column label="评价人" width="120">
            <template #default="scope">
              {{ scope.row.evaluator ? scope.row.evaluator.realName : '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="评分" width="120">
            <template #default="scope">
              <el-rate v-model="scope.row.score" :max="5" disabled></el-rate>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="评语" min-width="200" show-overflow-tooltip />
          <el-table-column label="评价时间" width="150">
            <template #default="scope">
              {{ formatDateTime(scope.row.evaluatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="danger" size="small" @click="handleDeleteEvaluation(scope.row)" v-if="hasPermission('USER_DELETE') && isEvaluationOwner(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getTaskEvaluations, getMyTaskEvaluations, deleteTaskEvaluation } from '@/api/taskEvaluation';
  import { useAuthStore } from '@/store/auth';
  
  const authStore = useAuthStore();
  
  // 数据
  const evaluations = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterMode = ref('all');
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 判断是否是评价的创建者
  const isEvaluationOwner = (evaluation) => {
    return evaluation.evaluatorId === authStore.user.id;
  };
  
  // 根据搜索条件过滤评价列表
  const filteredEvaluations = computed(() => {
    if (!searchQuery.value) {
      return evaluations.value;
    }
    
    return evaluations.value.filter(evaluation => {
      return evaluation.comment && evaluation.comment.toLowerCase().includes(searchQuery.value.toLowerCase());
    });
  });
  
  // 获取评价列表
  const fetchEvaluations = async () => {
    loading.value = true;
    try {
      let response;
      
      if (filterMode.value === 'my-evaluations') {
        response = await getMyTaskEvaluations();
      } else {
        response = await getTaskEvaluations();
      }
      
      if (response.code === 200) {
        evaluations.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取评价列表失败');
      }
    } catch (error) {
      console.error('获取评价列表失败:', error);
      ElMessage.error('获取评价列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 搜索评价
  const searchEvaluations = () => {
    fetchEvaluations();
  };
  
  // 删除评价
  const handleDeleteEvaluation = (row) => {
    ElMessageBox.confirm('确定要删除该评价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteTaskEvaluation(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchEvaluations();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除评价失败:', error);
        ElMessage.error('删除评价失败');
      }
    }).catch(() => {});
  };
  
  // 格式化日期时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchEvaluations();
  });
  </script>
  
  <style scoped>
  .evaluation-list {
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