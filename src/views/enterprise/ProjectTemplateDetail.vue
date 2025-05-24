<template>
    <div class="template-detail">
      <el-page-header @back="goBack" :title="template.name || '项目模板详情'">
        <template #content>
          <span class="page-header-title">{{ template.name || '加载中...' }}</span>
        </template>
      </el-page-header>
  
      <div class="page-content" v-loading="loading">
        <!-- 基本信息卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>基本信息</h3>
              <el-button type="primary" size="small" @click="handleEdit" v-if="hasPermission('USER_EDIT')">编辑</el-button>
            </div>
          </template>
          <div class="template-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="项目名称">{{ template.name }}</el-descriptions-item>
              <el-descriptions-item label="所属企业">
                {{ template.enterprise ? template.enterprise.name : '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="预计时长">{{ template.estimatedDuration }} 天</el-descriptions-item>
              <el-descriptions-item label="难度">
                <el-tag :type="getDifficultyType(template.difficulty)">
                  {{ getDifficultyLabel(template.difficulty) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="template.status === 1 ? 'success' : 'danger'">
                  {{ template.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(template.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="项目描述" :span="2">{{ template.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
  
        <!-- 项目详情卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>项目详情</h3>
            </div>
          </template>
          <div class="template-detail-section">
            <el-tabs>
              <el-tab-pane label="项目目标">
                <div class="detail-content">
                  <pre>{{ template.objectives || '暂无项目目标' }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="项目要求">
                <div class="detail-content">
                  <pre>{{ template.requirements || '暂无项目要求' }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="项目交付物">
                <div class="detail-content">
                  <pre>{{ template.deliverables || '暂无项目交付物' }}</pre>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
  
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="handleCreateProject" v-if="hasPermission('USER_CREATE')">基于此模板创建项目</el-button>
        </div>
      </div>
  
      <!-- 项目模板表单对话框 -->
      <el-dialog title="编辑项目模板" v-model="dialogVisible" width="600px">
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
  
      <!-- 创建项目对话框 -->
      <el-dialog title="创建项目" v-model="createProjectDialogVisible" width="600px">
        <el-form ref="projectFormRef" :model="projectForm" :rules="projectRules" label-width="100px">
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="projectForm.name" placeholder="请输入项目名称"></el-input>
          </el-form-item>
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker v-model="projectForm.startDate" type="date" placeholder="选择开始日期" 
              format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
          </el-form-item>
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker v-model="projectForm.endDate" type="date" placeholder="选择结束日期" 
              format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createProjectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProjectForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getProjectTemplateById, updateProjectTemplate } from '@/api/projectTemplate';
  import { getEnterprises } from '@/api/enterprise';
  import { createProject } from '@/api/project';
  import { useAuthStore } from '@/store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 项目模板ID
  const templateId = ref(route.params.id);
  
  // 页面数据
  const loading = ref(false);
  const template = ref({});
  const enterprises = ref([]);
  
  // 模板表单相关
  const dialogVisible = ref(false);
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
  const templateFormRef = ref(null);
  
  // 创建项目表单相关
  const createProjectDialogVisible = ref(false);
  const projectForm = reactive({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 0, // 初始状态为筹备中
    enterpriseId: null,
    templateId: null
  });
  const projectRules = {
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' }
    ],
    startDate: [
      { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    endDate: [
      { required: true, message: '请选择结束日期', trigger: 'change' }
    ]
  };
  const projectFormRef = ref(null);
  
  // 通用
  const submitLoading = ref(false);
  
  // 判断权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 返回上一页
  const goBack = () => {
    router.back();
  };
  
  // 获取项目模板详情
  const fetchTemplateDetail = async () => {
    loading.value = true;
    try {
      const response = await getProjectTemplateById(templateId.value);
      if (response.code === 200) {
        template.value = response.data || {};
      } else {
        ElMessage.error(response.message || '获取项目模板详情失败');
      }
    } catch (error) {
      console.error('获取项目模板详情失败:', error);
      ElMessage.error('获取项目模板详情失败');
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
  
  // 编辑项目模板
  const handleEdit = () => {
    // 填充表单
    Object.assign(templateForm, {
      id: template.value.id,
      enterpriseId: template.value.enterpriseId,
      name: template.value.name,
      description: template.value.description,
      objectives: template.value.objectives,
      requirements: template.value.requirements,
      deliverables: template.value.deliverables,
      estimatedDuration: template.value.estimatedDuration,
      difficulty: template.value.difficulty,
      status: template.value.status
    });
    
    dialogVisible.value = true;
  };
  
  // 提交项目模板表单
  const submitForm = async () => {
    if (templateFormRef.value) {
      try {
        await templateFormRef.value.validate();
        
        submitLoading.value = true;
        
        const response = await updateProjectTemplate(templateForm.id, templateForm);
        
        if (response.code === 200) {
          ElMessage.success('更新成功');
          dialogVisible.value = false;
          fetchTemplateDetail();
        } else {
          ElMessage.error(response.message || '更新失败');
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败，请检查表单数据');
      } finally {
        submitLoading.value = false;
      }
    }
  };
  
  // 基于模板创建项目
  const handleCreateProject = () => {
    // 初始化项目表单
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (template.value.estimatedDuration || 30));
    
    Object.assign(projectForm, {
      name: template.value.name,
      description: template.value.description,
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      status: 0,
      enterpriseId: template.value.enterpriseId,
      templateId: template.value.id
    });
    
    createProjectDialogVisible.value = true;
  };
  
  // 提交创建项目表单
  const submitProjectForm = async () => {
    if (projectFormRef.value) {
      try {
        await projectFormRef.value.validate();
        
        submitLoading.value = true;
        
        const response = await createProject(projectForm);
        
        if (response.code === 200) {
          ElMessage.success('项目创建成功');
          createProjectDialogVisible.value = false;
          // 跳转到项目详情页
          router.push(`/projects/${response.data.id}`);
        } else {
          ElMessage.error(response.message || '创建失败');
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
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    fetchTemplateDetail();
    fetchEnterprises();
  });
  </script>
  
  <style scoped>
  .template-detail {
    padding: 20px;
  }
  
  .page-header-title {
    font-weight: bold;
    font-size: 18px;
  }
  
  .page-content {
    margin-top: 20px;
  }
  
  .box-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h3 {
    margin: 0;
  }
  
  .template-info {
    margin-top: 10px;
  }
  
  .detail-content {
    padding: 10px;
    background: #f9f9f9;
    border-radius: 4px;
  }
  
  .detail-content pre {
    white-space: pre-wrap;
    font-family: inherit;
    margin: 0;
  }
  
  .action-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  </style>