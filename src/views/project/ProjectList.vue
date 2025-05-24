<template>
    <div class="project-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>实训项目列表</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_CREATE')">新增项目</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索项目名称" clearable @clear="fetchProjects" @keyup.enter="searchProjects">
            <template #append>
              <el-button @click="searchProjects">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="项目状态" clearable @change="fetchProjects">
            <el-option label="筹备中" :value="0"></el-option>
            <el-option label="进行中" :value="1"></el-option>
            <el-option label="已完成" :value="2"></el-option>
            <el-option label="已取消" :value="3"></el-option>
          </el-select>
        </div>
        
        <!-- 切换视图 -->
        <div class="view-toggle">
          <el-radio-group v-model="currentView" @change="fetchProjects">
            <el-radio-button label="all">所有项目</el-radio-button>
            <el-radio-button label="created">我创建的</el-radio-button>
            <el-radio-button label="participated">我参与的</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredProjects" v-loading="loading" border style="width: 100%">
          <el-table-column prop="name" label="项目名称" min-width="150" />
          <el-table-column prop="description" label="项目描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间范围" min-width="180">
            <template #default="scope">
              {{ formatDate(scope.row.startDate) }} ~ {{ formatDate(scope.row.endDate) }}
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
              <el-button size="small" type="primary" @click="handleView(scope.row)">查看</el-button>
              <el-button size="small" type="success" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 项目表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
        <el-form ref="projectFormRef" :model="projectForm" :rules="projectRules" label-width="100px">
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="projectForm.name" placeholder="请输入项目名称"></el-input>
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input v-model="projectForm.description" type="textarea" rows="4" placeholder="请输入项目描述"></el-input>
          </el-form-item>
          <el-form-item label="开始日期" prop="startDate">
  <el-date-picker
    v-model="projectForm.startDate"
    type="date"
    placeholder="选择开始日期"
    format="YYYY-MM-DD"
    value-format="YYYY-MM-DD"
  ></el-date-picker>
</el-form-item>
<el-form-item label="结束日期" prop="endDate">
  <el-date-picker
    v-model="projectForm.endDate"
    type="date"
    placeholder="选择结束日期"
    format="YYYY-MM-DD"
    value-format="YYYY-MM-DD"
  ></el-date-picker>
</el-form-item>
          <el-form-item label="项目状态" prop="status">
            <el-select v-model="projectForm.status" placeholder="请选择项目状态">
              <el-option label="筹备中" :value="0"></el-option>
              <el-option label="进行中" :value="1"></el-option>
              <el-option label="已完成" :value="2"></el-option>
              <el-option label="已取消" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="关联企业" prop="enterpriseId">
            <el-select v-model="projectForm.enterpriseId" placeholder="请选择关联企业">
              <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getProjects, getMyCreatedProjects, getMyParticipatedProjects, createProject, updateProject, deleteProject } from '@/api/project';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  const projectFormRef = ref(null);
  
  // 数据列表
  const projects = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterStatus = ref('');
  const currentView = ref('all');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增项目');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  const dateRange = ref([]);
  
  // 表单对象
  const projectForm = reactive({
    id: null,
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 0,
    enterpriseId: null
  });
  
  // 表单校验规则
  const projectRules = {
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' }
    ],
    startDate: [
      { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    endDate: [
      { required: true, message: '请选择结束日期', trigger: 'change' }
    ],
    status: [
      { required: true, message: '请选择项目状态', trigger: 'change' }
    ]
  };
  
  // 企业列表（假设数据，后续需从API获取）
  const enterprises = ref([
    { id: 1, name: '阿里巴巴' },
    { id: 2, name: '腾讯科技' },
  { id: 3, name: '百度' },
  { id: 4, name: '字节跳动' }
]);

// 根据搜索条件过滤项目列表
const filteredProjects = computed(() => {
  if (!searchQuery.value && filterStatus.value === '') {
    return projects.value;
  }
  
  return projects.value.filter(project => {
    const nameMatch = !searchQuery.value || 
                     project.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const statusMatch = filterStatus.value === '' || 
                       project.status === filterStatus.value;
    return nameMatch && statusMatch;
  });
});

// 判断是否有权限
const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

// 获取项目列表
const fetchProjects = async () => {
  loading.value = true;
  try {
    let response;
    
    if (currentView.value === 'created') {
      response = await getMyCreatedProjects();
    } else if (currentView.value === 'participated') {
      response = await getMyParticipatedProjects();
    } else {
      response = await getProjects();
    }
    
    if (response.code === 200) {
      projects.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取项目列表失败');
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    ElMessage.error('获取项目列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索项目
const searchProjects = () => {
  fetchProjects();
};

// 新增项目
const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '新增项目';
  
  // 重置表单
  Object.assign(projectForm, {
    id: null,
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 0,
    enterpriseId: null
  });
  
  dateRange.value = [];
  dialogVisible.value = true;
};

// 编辑项目
const handleEdit = (row) => {
  isEdit.value = true;
  dialogTitle.value = '编辑项目';
  
  // 填充表单
  Object.assign(projectForm, {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    enterpriseId: row.enterpriseId
  });
  
  dateRange.value = [row.startDate, row.endDate];
  dialogVisible.value = true;
};

// 查看项目详情
const handleView = (row) => {
  router.push(`/projects/${row.id}`);
};

// 删除项目
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该项目吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteProject(row.id);
      if (response.code === 200) {
        ElMessage.success('删除成功');
        fetchProjects();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      ElMessage.error('删除项目失败');
    }
  }).catch(() => {});
};

// 处理日期范围变化
// 处理日期范围变化
const handleDateRangeChange = (val) => {
  console.log('日期范围变化:', val);  // 添加调试信息
  
  if (val && val.length === 2) {
    projectForm.startDate = val[0];
    projectForm.endDate = val[1];
  } else {
    projectForm.startDate = null;
    projectForm.endDate = null;
  }
};

// 提交表单
// 提交表单
// 提交表单
const submitForm = async () => {
  if (projectFormRef.value) {
    try {
      await projectFormRef.value.validate();
      
      // 手动处理日期
      const today = new Date();
      const startDate = dateRange.value && dateRange.value[0] 
        ? dateRange.value[0] : formatDate(today);
      const endDate = dateRange.value && dateRange.value[1]
        ? dateRange.value[1] : formatDate(today);
      
      const formData = {
        ...projectForm,
        startDate: startDate,
        endDate: endDate
      };
      
      console.log('处理后的表单数据:', formData);
      
      submitLoading.value = true;
      
      let response;
      if (isEdit.value) {
        response = await updateProject(formData.id, formData);
      } else {
        response = await createProject(formData);
      }
      
      if (response.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        fetchProjects();
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
    0: '筹备中',
    1: '进行中',
    2: '已完成',
    3: '已取消'
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
  fetchProjects();
});
</script>

<style scoped>
.project-list {
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