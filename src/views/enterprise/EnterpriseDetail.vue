<template>
    <div class="enterprise-detail">
      <el-page-header @back="goBack" :title="enterprise.name || '企业详情'">
        <template #content>
          <span class="page-header-title">{{ enterprise.name || '加载中...' }}</span>
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
          <div class="enterprise-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="企业名称">{{ enterprise.name }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="enterprise.status === 1 ? 'success' : 'danger'">
                  {{ enterprise.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="联系人">{{ enterprise.contactPerson }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ enterprise.contactPhone }}</el-descriptions-item>
              <el-descriptions-item label="电子邮箱">{{ enterprise.email }}</el-descriptions-item>
              <el-descriptions-item label="企业网站">
                <a :href="enterprise.website" target="_blank" v-if="enterprise.website">{{ enterprise.website }}</a>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="企业地址" :span="2">{{ enterprise.address || '-' }}</el-descriptions-item>
              <el-descriptions-item label="企业描述" :span="2">{{ enterprise.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
  
        <!-- 企业导师卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>企业导师</h3>
              <el-button type="primary" size="small" @click="handleAddMentor" v-if="hasPermission('USER_CREATE')">添加导师</el-button>
            </div>
          </template>
          <div class="mentors-section">
            <el-table :data="mentors" border v-loading="mentorsLoading">
              <el-table-column label="导师姓名" min-width="120">
                <template #default="scope">
                  {{ scope.row.user ? scope.row.user.realName : '未知' }}
                </template>
              </el-table-column>
              <el-table-column prop="position" label="职位" min-width="120" />
              <el-table-column prop="expertise" label="专业领域" min-width="150" />
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                    {{ scope.row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <el-button type="primary" size="small" @click="handleEditMentor(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
                  <el-button type="danger" size="small" @click="handleDeleteMentor(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="empty-state" v-if="mentors.length === 0 && !mentorsLoading">
              <el-empty description="暂无企业导师"></el-empty>
            </div>
          </div>
        </el-card>
  
        <!-- 项目模板卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>项目库</h3>
              <el-button type="primary" size="small" @click="handleAddTemplate" v-if="hasPermission('USER_CREATE')">添加项目</el-button>
            </div>
          </template>
          <div class="templates-section">
            <el-table :data="templates" border v-loading="templatesLoading">
              <el-table-column prop="name" label="项目名称" min-width="150" />
              <el-table-column prop="description" label="项目描述" min-width="200" show-overflow-tooltip />
              <el-table-column label="预计时长" width="120">
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
                  <el-button type="primary" size="small" @click="handleViewTemplate(scope.row)">查看</el-button>
                  <el-button type="success" size="small" @click="handleEditTemplate(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
                  <el-button type="danger" size="small" @click="handleDeleteTemplate(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="empty-state" v-if="templates.length === 0 && !templatesLoading">
              <el-empty description="暂无项目模板"></el-empty>
            </div>
          </div>
        </el-card>
      </div>
  
      <!-- 企业表单对话框 -->
      <el-dialog title="编辑企业" v-model="enterpriseDialogVisible" width="600px">
        <el-form ref="enterpriseFormRef" :model="enterpriseForm" :rules="enterpriseRules" label-width="100px">
          <el-form-item label="企业名称" prop="name">
            <el-input v-model="enterpriseForm.name" placeholder="请输入企业名称"></el-input>
          </el-form-item>
          <el-form-item label="企业描述" prop="description">
            <el-input v-model="enterpriseForm.description" type="textarea" rows="3" placeholder="请输入企业描述"></el-input>
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="enterpriseForm.contactPerson" placeholder="请输入联系人"></el-input>
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="enterpriseForm.contactPhone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
          <el-form-item label="企业地址" prop="address">
            <el-input v-model="enterpriseForm.address" placeholder="请输入企业地址"></el-input>
          </el-form-item>
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="enterpriseForm.email" placeholder="请输入电子邮箱"></el-input>
          </el-form-item>
          <el-form-item label="企业网站" prop="website">
            <el-input v-model="enterpriseForm.website" placeholder="请输入企业网站"></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="enterpriseForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="enterpriseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEnterpriseForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 导师表单对话框 -->
      <el-dialog :title="mentorDialogTitle" v-model="mentorDialogVisible" width="600px">
        <el-form ref="mentorFormRef" :model="mentorForm" :rules="mentorRules" label-width="100px">
          <el-form-item label="用户" prop="userId">
            <el-select v-model="mentorForm.userId" filterable placeholder="请选择用户" style="width: 100%">
              <el-option v-for="user in users" :key="user.id" :label="user.realName" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="职位" prop="position">
            <el-input v-model="mentorForm.position" placeholder="请输入职位"></el-input>
          </el-form-item>
          <el-form-item label="专业领域" prop="expertise">
            <el-input v-model="mentorForm.expertise" placeholder="请输入专业领域"></el-input>
          </el-form-item>
          <el-form-item label="个人介绍" prop="introduction">
            <el-input v-model="mentorForm.introduction" type="textarea" rows="3" placeholder="请输入个人介绍"></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="mentorForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="mentorDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMentorForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 项目模板表单对话框 -->
      <el-dialog :title="templateDialogTitle" v-model="templateDialogVisible" width="600px">
        <el-form ref="templateFormRef" :model="templateForm" :rules="templateRules" label-width="100px">
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
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTemplateForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getEnterpriseById, updateEnterprise } from '@/api/enterprise';
  import { getMentorsByEnterpriseId, createEnterpriseMentor, updateEnterpriseMentor, deleteEnterpriseMentor } from '@/api/enterpriseMentor';
  import { getTemplatesByEnterpriseId, createProjectTemplate, updateProjectTemplate, deleteProjectTemplate } from '@/api/projectTemplate';
  import { getUsers } from '@/api/user';
  import { useAuthStore } from '@/store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 企业ID
  const enterpriseId = ref(route.params.id);
  
  // 页面数据
  const loading = ref(false);
  const enterprise = ref({});
  const mentors = ref([]);
  const templates = ref([]);
  const users = ref([]);
  const mentorsLoading = ref(false);
  const templatesLoading = ref(false);
  
  // 企业表单相关
  const enterpriseDialogVisible = ref(false);
  const enterpriseForm = reactive({
    id: null,
    name: '',
    description: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    email: '',
    website: '',
    status: 1
  });
  const enterpriseRules = {
    name: [
      { required: true, message: '请输入企业名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    contactPerson: [
      { required: true, message: '请输入联系人', trigger: 'blur' }
    ],
    contactPhone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ]
  };
  const enterpriseFormRef = ref(null);
  
  // 导师表单相关
  const mentorDialogVisible = ref(false);
  const mentorDialogTitle = ref('添加企业导师');
  const mentorForm = reactive({
    id: null,
    enterpriseId: null,
    userId: null,
    position: '',
    expertise: '',
    introduction: '',
    status: 1
  });
  const mentorRules = {
    userId: [
      { required: true, message: '请选择用户', trigger: 'change' }
    ],
    position: [
      { required: true, message: '请输入职位', trigger: 'blur' }
    ]
  };
  const mentorFormRef = ref(null);
  
  // 项目模板表单相关
  const templateDialogVisible = ref(false);
  const templateDialogTitle = ref('添加项目模板');
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
  
  // 获取企业详情
  const fetchEnterpriseDetail = async () => {
    loading.value = true;
    try {
      const response = await getEnterpriseById(enterpriseId.value);
      if (response.code === 200) {
        enterprise.value = response.data || {};
      } else {
        ElMessage.error(response.message || '获取企业详情失败');
      }
    } catch (error) {
      console.error('获取企业详情失败:', error);
      ElMessage.error('获取企业详情失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 获取企业导师列表
  const fetchEnterpriseMentors = async () => {
    mentorsLoading.value = true;
    try {
      const response = await getMentorsByEnterpriseId(enterpriseId.value);
      if (response.code === 200) {
        mentors.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取企业导师列表失败');
      }
    } catch (error) {
      console.error('获取企业导师列表失败:', error);
      ElMessage.error('获取企业导师列表失败');
    } finally {
      mentorsLoading.value = false;
    }
  };
  
  // 获取项目模板列表
  const fetchProjectTemplates = async () => {
    templatesLoading.value = true;
    try {
      const response = await getTemplatesByEnterpriseId(enterpriseId.value);
      if (response.code === 200) {
        templates.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取项目模板列表失败');
      }
    } catch (error) {
      console.error('获取项目模板列表失败:', error);
      ElMessage.error('获取项目模板列表失败');
    } finally {
      templatesLoading.value = false;
    }
  };
  
  // 获取用户列表（用于选择导师）
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.code === 200) {
        users.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      ElMessage.error('获取用户列表失败');
    }
  };
  
  // 编辑企业信息
  const handleEdit = () => {
    // 填充表单
    Object.assign(enterpriseForm, {
      id: enterprise.value.id,
      name: enterprise.value.name,
      description: enterprise.value.description,
      contactPerson: enterprise.value.contactPerson,
      contactPhone: enterprise.value.contactPhone,
      address: enterprise.value.address,
      email: enterprise.value.email,
      website: enterprise.value.website,
      status: enterprise.value.status
    });
    
    enterpriseDialogVisible.value = true;
  };
  
  // 提交企业表单
  const submitEnterpriseForm = async () => {
    if (enterpriseFormRef.value) {
      try {
        await enterpriseFormRef.value.validate();
        
        submitLoading.value = true;
        
        const response = await updateEnterprise(enterpriseForm.id, enterpriseForm);
        
        if (response.code === 200) {
          ElMessage.success('更新成功');
          enterpriseDialogVisible.value = false;
          fetchEnterpriseDetail();
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
  
  // 添加导师
  const handleAddMentor = () => {
    mentorDialogTitle.value = '添加企业导师';
    
    // 重置表单
    Object.assign(mentorForm, {
      id: null,
      enterpriseId: enterpriseId.value,
      userId: null,
      position: '',
      expertise: '',
      introduction: '',
      status: 1
    });
    
    mentorDialogVisible.value = true;
  };
  
  // 编辑导师
  const handleEditMentor = (row) => {
    mentorDialogTitle.value = '编辑企业导师';
    
    // 填充表单
    Object.assign(mentorForm, {
      id: row.id,
      enterpriseId: row.enterpriseId,
      userId: row.userId,
      position: row.position,
      expertise: row.expertise,
      introduction: row.introduction,
      status: row.status
    });
    
    mentorDialogVisible.value = true;
  };
  
  // 删除导师
  const handleDeleteMentor = (row) => {
    ElMessageBox.confirm('确定要删除该企业导师吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteEnterpriseMentor(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchEnterpriseMentors();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除企业导师失败:', error);
        ElMessage.error('删除企业导师失败');
      }
    }).catch(() => {});
  };
  
  // 提交导师表单
  const submitMentorForm = async () => {
    if (mentorFormRef.value) {
      try {
        await mentorFormRef.value.validate();
        
        submitLoading.value = true;
        
        let response;
        if (mentorForm.id) {
          response = await updateEnterpriseMentor(mentorForm.id, mentorForm);
        } else {
          response = await createEnterpriseMentor(mentorForm);
        }
        
        if (response.code === 200) {
          ElMessage.success(mentorForm.id ? '更新成功' : '创建成功');
          mentorDialogVisible.value = false;
          fetchEnterpriseMentors();
        } else {
          ElMessage.error(response.message || (mentorForm.id ? '更新失败' : '创建失败'));
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败，请检查表单数据');
      } finally {
        submitLoading.value = false;
      }
    }
  };
  
  // 添加项目模板
  const handleAddTemplate = () => {
    templateDialogTitle.value = '添加项目模板';
    
    // 重置表单
    Object.assign(templateForm, {
      id: null,
      enterpriseId: enterpriseId.value,
      name: '',
      description: '',
      objectives: '',
      requirements: '',
      deliverables: '',
      estimatedDuration: 30,
      difficulty: 2,
      status: 1
    });
    
    templateDialogVisible.value = true;
  };
  
  // 查看项目模板
  const handleViewTemplate = (row) => {
    router.push(`/project-templates/${row.id}`);
  };
  
  // 编辑项目模板
  const handleEditTemplate = (row) => {
    templateDialogTitle.value = '编辑项目模板';
    
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
    
    templateDialogVisible.value = true;
  };
  
  // 删除项目模板
  const handleDeleteTemplate = (row) => {
    ElMessageBox.confirm('确定要删除该项目模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteProjectTemplate(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchProjectTemplates();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除项目模板失败:', error);
        ElMessage.error('删除项目模板失败');
      }
    }).catch(() => {});
  };
  
  // 提交项目模板表单
  const submitTemplateForm = async () => {
    if (templateFormRef.value) {
      try {
        await templateFormRef.value.validate();
        
        submitLoading.value = true;
        
        let response;
        if (templateForm.id) {
          response = await updateProjectTemplate(templateForm.id, templateForm);
        } else {
          response = await createProjectTemplate(templateForm);
        }
        
        if (response.code === 200) {
          ElMessage.success(templateForm.id ? '更新成功' : '创建成功');
          templateDialogVisible.value = false;
          fetchProjectTemplates();
        } else {
          ElMessage.error(response.message || (templateForm.id ? '更新失败' : '创建失败'));
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
    fetchEnterpriseDetail();
    fetchEnterpriseMentors();
    fetchProjectTemplates();
    fetchUsers();
  });
  </script>
  
  <style scoped>
  .enterprise-detail {
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
  
  .enterprise-info {
    margin-top: 10px;
  }
  
  .mentors-section, .templates-section {
    margin-top: 10px;
  }
  
  .empty-state {
    padding: 20px 0;
  }
  </style>