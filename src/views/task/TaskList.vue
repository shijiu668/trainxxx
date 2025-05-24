<template>
    <div class="task-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>任务列表</h3>
            <el-button type="primary" @click="handleAddTask" v-if="hasPermission('USER_CREATE')">新增任务</el-button>
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
        
        <!-- 切换视图 -->
        <div class="view-toggle">
          <el-radio-group v-model="currentView" @change="fetchTasks">
            <el-radio-button label="all">所有任务</el-radio-button>
            <el-radio-button label="created">我创建的</el-radio-button>
            <el-radio-button label="assigned">分配给我的</el-radio-button>
          </el-radio-group>
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
          <el-table-column label="指派给" width="120">
            <template #default="scope">
              {{ scope.row.assignee ? scope.row.assignee.realName : '未指派' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" @click="handleViewTask(scope.row)">查看</el-button>
              <el-button size="small" type="success" @click="handleEditTask(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteTask(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 任务表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
        <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="100px">
          <el-form-item label="所属项目" prop="projectId">
            <el-select v-model="taskForm.projectId" placeholder="请选择所属项目" style="width: 100%">
              <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="任务标题" prop="title">
            <el-input v-model="taskForm.title" placeholder="请输入任务标题"></el-input>
          </el-form-item>
          <el-form-item label="任务描述" prop="description">
            <el-input v-model="taskForm.description" type="textarea" rows="4" placeholder="请输入任务描述"></el-input>
          </el-form-item>
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker v-model="taskForm.startDate" type="date" placeholder="选择开始日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
          </el-form-item>
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker v-model="taskForm.endDate" type="date" placeholder="选择结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
          </el-form-item>
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="taskForm.status" placeholder="请选择任务状态" style="width: 100%">
              <el-option label="未开始" :value="0"></el-option>
              <el-option label="进行中" :value="1"></el-option>
              <el-option label="已完成" :value="2"></el-option>
              <el-option label="已逾期" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="指派给" prop="assignedTo">
            <el-select v-model="taskForm.assignedTo" placeholder="请选择指派人" style="width: 100%">
              <el-option v-for="user in users" :key="user.id" :label="user.realName" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getTasks, getTasksCreatedByMe, getTasksAssignedToMe, createTask, updateTask, deleteTask } from '@/api/task';
  import { getProjects } from '@/api/project';
  import { getUsers } from '@/api/user';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  const taskFormRef = ref(null);
  
  // 数据列表
  const tasks = ref([]);
  const projects = ref([]);
  const users = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterStatus = ref('');
  const currentView = ref('all');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增任务');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const taskForm = reactive({
    id: null,
    projectId: null,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 0,
    assignedTo: null
  });
  
  // 表单校验规则
  const taskRules = {
    projectId: [
      { required: true, message: '请选择所属项目', trigger: 'change' }
    ],
    title: [
      { required: true, message: '请输入任务标题', trigger: 'blur' }
    ],
    startDate: [
      { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    endDate: [
      { required: true, message: '请选择结束日期', trigger: 'change' }
    ]
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
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取任务列表
  const fetchTasks = async () => {
    loading.value = true;
    try {
      let response;
      
      if (currentView.value === 'created') {
        response = await getTasksCreatedByMe();
      } else if (currentView.value === 'assigned') {
        response = await getTasksAssignedToMe();
      } else {
        response = await getTasks();
      }
      
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
  
  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      if (response.code === 200) {
        projects.value = response.data || [];
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };
  
  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.code === 200) {
        users.value = response.data || [];
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };
  
  // 搜索任务
  const searchTasks = () => {
    fetchTasks();
  };
  
  // 新增任务
  const handleAddTask = () => {
    isEdit.value = false;
    dialogTitle.value = '新增任务';
    
    // 重置表单
    Object.assign(taskForm, {
      id: null,
      projectId: null,
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 0,
      assignedTo: null
    });
    
    dialogVisible.value = true;
  };
  
// 编辑任务
const handleEditTask = (row) => {
  isEdit.value = true;
  dialogTitle.value = '编辑任务';
  
  // 填充表单
  Object.assign(taskForm, {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    startDate: formatDate(row.startDate),
    endDate: formatDate(row.endDate),
    status: row.status,
    assignedTo: row.assignedTo
  });
  
  dialogVisible.value = true;
};

// 查看任务详情
const handleViewTask = (row) => {
  router.push(`/tasks/${row.id}`);
};

// 删除任务
const handleDeleteTask = (row) => {
  ElMessageBox.confirm('确定要删除该任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteTask(row.id);
      if (response.code === 200) {
        ElMessage.success('删除成功');
        fetchTasks();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      ElMessage.error('删除任务失败');
    }
  }).catch(() => {});
};

// 提交表单
const submitTaskForm = async () => {
  if (taskFormRef.value) {
    try {
      await taskFormRef.value.validate();
      
      submitLoading.value = true;
      
      let response;
      if (isEdit.value) {
        response = await updateTask(taskForm.id, taskForm);
      } else {
        response = await createTask(taskForm);
      }
      
      if (response.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        fetchTasks();
      } else {
        ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('表单提交错误:', error);
      ElMessage.error('操作失败，请检查表单数据');
    } finally {
      submitLoading.value = false;
    }
  }
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
  fetchProjects();
  fetchUsers();
});
</script>

<style scoped>
.task-list {
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

.view-toggle {
  margin-bottom: 20px;
}
</style>