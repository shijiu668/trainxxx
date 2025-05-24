<template>
    <div class="template-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>项目库管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_CREATE')">新增项目模板</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索项目名称" clearable @clear="fetchTemplates" @keyup.enter="fetchTemplates">
            <template #append>
              <el-button @click="fetchTemplates">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterEnterprise" placeholder="所属企业" clearable @change="fetchTemplates">
            <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
          </el-select>
          <el-select v-model="filterDifficulty" placeholder="难度" clearable @change="fetchTemplates">
            <el-option :value="1" label="简单"></el-option>
            <el-option :value="2" label="中等"></el-option>
            <el-option :value="3" label="困难"></el-option>
          </el-select>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredTemplates" v-loading="loading" border style="width: 100%">
          <el-table-column prop="name" label="项目名称" min-width="150" />
          <el-table-column label="所属企业" min-width="150">
            <template #default="scope">
              {{ scope.row.enterprise ? scope.row.enterprise.name : '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="项目描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="预计时长" width="100">
            <template #default="scope">
              {{ scope.row.estimatedDuration }} 天
            </template>
          </el-table-column>
          <el-table-column label="难度" width="100">
            <template #default="scope">
              <el-tag :type="getDifficultyType(scope.row.difficulty)">
                {{ getDifficultyLabel(scope.row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
              <el-button type="success" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 项目模板表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
        <el-form ref="templateFormRef" :model="templateForm" :rules="templateRules" label-width="100px">
          <el-form-item label="所属企业" prop="enterpriseId">
            <el-select v-model="templateForm.enterpriseId" filterable placeholder="请选择企业" style="width: 100%">
              <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="templateForm.name" placeholder="请输入项目名称"></el-input>
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input v-model="templateForm.description" type="textarea" rows="3" placeholder="请输入项目描述"></el-input>
          </el-form-item>
          <el-form-item label="项目目标" prop="objectives">
            <el-input v-model="templateForm.objectives" type="textarea" rows="3" placeholder="请输入项目目标"></el-input>
          </el-form-item>
          <el-form-item label="项目要求" prop="requirements">
            <el-input v-model="templateForm.requirements" type="textarea" rows="3" placeholder="请输入项目要求"></el-input>
          </el-form-item>
          <el-form-item label="项目交付物" prop="deliverables">
            <el-input v-model="templateForm.deliverables" type="textarea" rows="3" placeholder="请输入项目交付物"></el-input>
          </el-form-item>
          <el-form-item label="预计时长(天)" prop="estimatedDuration">
            <el-input-number v-model="templateForm.estimatedDuration" :min="1" :max="365" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="难度" prop="difficulty">
            <el-select v-model="templateForm.difficulty" placeholder="请选择难度" style="width: 100%">
              <el-option :value="1" label="简单"></el-option>
              <el-option :value="2" label="中等"></el-option>
              <el-option :value="3" label="困难"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="templateForm.status" :active-value="1" :inactive-value="0"></el-switch>
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
  import { getProjectTemplates, createProjectTemplate, updateProjectTemplate, deleteProjectTemplate } from '@/api/projectTemplate';
  import { getEnterprises } from '@/api/enterprise';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 数据列表
  const templates = ref([]);
  const enterprises = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterEnterprise = ref('');
  const filterDifficulty = ref('');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增项目模板');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const templateForm = reactive({
    id: null,
    enterpriseId: null,
    name: '',
    description: '',
    objectives: '',
    requirements: '',
    deliverables: '',
    estimatedDuration: 30,
    difficulty: 2,
    status: 1
  });
  
  // 表单校验规则
  const templateRules = {
    enterpriseId: [
      { required: true, message: '请选择企业', trigger: 'change' }
    ],
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' }
    ],
    estimatedDuration: [
      { required: true, message: '请输入预计时长', trigger: 'blur' }
    ],
    difficulty: [
      { required: true, message: '请选择难度', trigger: 'change' }
    ]
  };
  
  // 表单引用
  const templateFormRef = ref(null);
  
  // 根据搜索条件过滤项目模板列表
  const filteredTemplates = computed(() => {
    let result = templates.value;
    
    // 按企业筛选
    if (filterEnterprise.value) {
      result = result.filter(template => template.enterpriseId === filterEnterprise.value);
    }
    
    // 按难度筛选
    if (filterDifficulty.value) {
      result = result.filter(template => template.difficulty === filterDifficulty.value);
    }
    
    // 按关键词搜索
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(template => {
        return template.name.toLowerCase().includes(query);
      });
    }
    
    return result;
  });
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取项目模板列表
  const fetchTemplates = async () => {
    loading.value = true;
    try {
      const response = await getProjectTemplates();
      if (response.code === 200) {
        templates.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取项目模板列表失败');
      }
    } catch (error) {
      console.error('获取项目模板列表失败:', error);
      ElMessage.error('获取项目模板列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 获取企业列表
  const fetchEnterprises = async () => {
    try {
      const response = await getEnterprises();
      if (response.code === 200) {
        enterprises.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取企业列表失败');
      }
    } catch (error) {
      console.error('获取企业列表失败:', error);
      ElMessage.error('获取企业列表失败');
    }
  };
  
  // 新增项目模板
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '新增项目模板';
    
    // 重置表单
    Object.assign(templateForm, {
      id: null,
      enterpriseId: null,
      name: '',
      description: '',
      objectives: '',
      requirements: '',
      deliverables: '',
      estimatedDuration: 30,
      difficulty: 2,
      status: 1
    });
    
    dialogVisible.value = true;
  };
  
  // 查看项目模板
  const handleView = (row) => {
    router.push(`/project-templates/${row.id}`);
  };
  
  // 编辑项目模板
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑项目模板';
    
    // 填充表单
    Object.assign(templateForm, {
      id: row.id,
      enterpriseId: row.enterpriseId,
      name: row.name,
      description: row.description,
      objectives: row.objectives,
      requirements: row.requirements,
      deliverables: row.deliverables,
      estimatedDuration: row.estimatedDuration,
      difficulty: row.difficulty,
      status: row.status
    });
    
    dialogVisible.value = true;
  };
  
  // 删除项目模板
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该项目模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteProjectTemplate(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchTemplates();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除项目模板失败:', error);
        ElMessage.error('删除项目模板失败');
      }
    }).catch(() => {});
  };
  
  // 提交表单
  const submitForm = async () => {
    if (templateFormRef.value) {
      try {
        await templateFormRef.value.validate();
        
        submitLoading.value = true;
        
        let response;
        if (isEdit.value) {
          response = await updateProjectTemplate(templateForm.id, templateForm);
        } else {
          response = await createProjectTemplate(templateForm);
        }
        
        if (response.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
          dialogVisible.value = false;
          fetchTemplates();
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
  
  // 获取难度标签
  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      1: '简单',
      2: '中等',
      3: '困难'
    };
    return difficultyMap[difficulty] || '未知';
  };
  
  // 获取难度标签类型
  const getDifficultyType = (difficulty) => {
    const typeMap = {
      1: 'success',
      2: 'warning',
      3: 'danger'
    };
    return typeMap[difficulty] || '';
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchTemplates();
    fetchEnterprises();
  });
  </script>
  
  <style scoped>
  .template-list {
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