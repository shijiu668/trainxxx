<template>
    <div class="assigned-tasks">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>我的任务</h3>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索任务标题" clearable @clear="fetchTasks" @keyup.enter="searchTasks">
            <template #append>
              <el-button @click="searchTasks">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="任务状态" clearable @change="fetchTasks">
            <el-option label="未开始" :value="0"></el-option>
            <el-option label="进行中" :value="1"></el-option>
            <el-option label="已完成" :value="2"></el-option>
            <el-option label="已逾期" :value="3"></el-option>
          </el-select>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredTasks" v-loading="loading" border style="width: 100%">
          <el-table-column prop="title" label="任务标题" min-width="150" />
          <el-table-column prop="description" label="任务描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间范围" min-width="180">
            <template #default="scope">
              {{ formatDate(scope.row.startDate) }} ~ {{ formatDate(scope.row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column label="创建者" width="120">
            <template #default="scope">
              {{ scope.row.creator ? scope.row.creator.realName : '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleViewTask(scope.row)">查看</el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="handleSubmitTask(scope.row)" 
                v-if="scope.row.status !== 2">
                提交成果
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="handleUpdateTaskStatus(scope.row, 2)" 
                v-if="hasPermission('USER_EDIT') && scope.row.status !== 2">
                标记完成
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 提交对话框 -->
      <el-dialog title="提交任务成果" v-model="submissionDialogVisible" width="600px">
        <el-form ref="submissionFormRef" :model="submissionForm" :rules="submissionRules" label-width="100px">
          <el-form-item label="提交标题" prop="title">
            <el-input v-model="submissionForm.title" placeholder="请输入提交标题"></el-input>
          </el-form-item>
          <el-form-item label="提交内容" prop="content">
            <el-input v-model="submissionForm.content" type="textarea" rows="6" placeholder="请输入提交内容"></el-input>
          </el-form-item>
          <el-form-item label="提交文件" prop="fileUrl">
            <el-upload
              class="upload-demo"
              action="/api/file/upload"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload">
              <el-button type="primary">点击上传</el-button>
              <template #tip>
                <div class="el-upload__tip">支持上传各种格式文件，单个文件不超过10MB</div>
              </template>
            </el-upload>
            <div v-if="submissionForm.fileUrl" class="file-info">
              已上传文件: {{ getFileName(submissionForm.fileUrl) }}
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="submissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSubmissionForm" :loading="submissionLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  import { getTasksAssignedToMe, updateTaskStatus } from '@/api/task';
  import { createSubmission } from '@/api/submission';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  const submissionFormRef = ref(null);
  
  // 数据
  const tasks = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterStatus = ref('');
  
  // 提交对话框控制
  const submissionDialogVisible = ref(false);
  const submissionLoading = ref(false);
  const currentTaskId = ref(null);
  
  // 提交表单
  const submissionForm = reactive({
    taskId: null,
    title: '',
    content: '',
    fileUrl: '',
    status: 0
  });
  
  // 提交表单校验规则
  const submissionRules = {
    title: [
      { required: true, message: '请输入提交标题', trigger: 'blur' }
    ],
    content: [
      { required: true, message: '请输入提交内容', trigger: 'blur' }
    ]
  };
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 根据搜索条件过滤任务列表
  const filteredTasks = computed(() => {
    if (!searchQuery.value && filterStatus.value === '') {
      return tasks.value;
    }
    
    return tasks.value.filter(task => {
      const titleMatch = !searchQuery.value || 
                       task.title.toLowerCase().includes(searchQuery.value.toLowerCase());
      const statusMatch = filterStatus.value === '' || 
                         task.status === filterStatus.value;
      return titleMatch && statusMatch;
    });
  });
  
  // 获取任务列表
  const fetchTasks = async () => {
    loading.value = true;
    try {
      const response = await getTasksAssignedToMe();
      if (response.code === 200) {
        tasks.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取任务列表失败');
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      ElMessage.error('获取任务列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 搜索任务
  const searchTasks = () => {
    fetchTasks();
  };
  
  // 查看任务详情
  const handleViewTask = (row) => {
    router.push(`/tasks/${row.id}`);
  };
  
  // 提交任务
  const handleSubmitTask = (row) => {
    currentTaskId.value = row.id;
    
    // 重置表单
    Object.assign(submissionForm, {
      taskId: row.id,
      title: `${row.title} - 提交`,
      content: '',
      fileUrl: '',
      status: 0
    });
    
    submissionDialogVisible.value = true;
  };
  
  // 更新任务状态
  const handleUpdateTaskStatus = async (row, status) => {
    try {
      const response = await updateTaskStatus(row.id, status);
      if (response.code === 200) {
        ElMessage.success('状态更新成功');
        fetchTasks();
      } else {
        ElMessage.error(response.message || '状态更新失败');
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
      ElMessage.error('更新任务状态失败');
    }
  };
  
  // 文件上传前的处理
  const beforeUpload = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      ElMessage.error('文件大小不能超过10MB!');
      return false;
    }
    return true;
  };
  
  // 文件上传成功的处理
  const handleUploadSuccess = (response, file) => {
    if (response.code === 200) {
      submissionForm.fileUrl = response.data;
      ElMessage.success('文件上传成功');
    } else {
      ElMessage.error(response.message || '文件上传失败');
    }
  };
  
  // 提交表单
  const submitSubmissionForm = async () => {
    if (submissionFormRef.value) {
      try {
        await submissionFormRef.value.validate();
        
        submissionLoading.value = true;
        
        const response = await createSubmission(submissionForm);
        
        if (response.code === 200) {
          ElMessage.success('提交成功');
          submissionDialogVisible.value = false;
          
          // 可选：将任务状态更新为进行中
          await handleUpdateTaskStatus({ id: currentTaskId.value }, 1);
        } else {
          ElMessage.error(response.message || '提交失败');
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败，请检查表单数据');
      } finally {
        submissionLoading.value = false;
      }
    }
  };
  
  // 获取文件名
  const getFileName = (url) => {
    if (!url) return '';
    return url.substring(url.lastIndexOf('/') + 1);
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 获取状态标签
  const getStatusLabel = (status) => {
    const statusMap = {
      0: '未开始',
      1: '进行中',
      2: '已完成',
      3: '已逾期'
    };
    return statusMap[status] || '未知';
  };
  
  // 获取状态类型
  const getStatusType = (status) => {
    const typeMap = {
      0: 'info',
      1: 'primary',
      2: 'success',
      3: 'danger'
    };
    return typeMap[status] || '';
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchTasks();
  });
  </script>
  
  <style scoped>
  .assigned-tasks {
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
  
  .file-info {
    margin-top: 10px;
    color: #409EFF;
  }
  </style>