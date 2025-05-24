<template>
  <div class="project-detail">
    <el-page-header @back="goBack" :title="project.name || '项目详情'">
      <template #content>
        <span class="page-header-title">{{ project.name || '加载中...' }}</span>
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
        <div class="project-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
            <el-descriptions-item label="项目状态">
              <el-tag :type="getStatusType(project.status)">{{ getStatusLabel(project.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ formatDate(project.startDate) }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ formatDate(project.endDate) }}</el-descriptions-item>
            <el-descriptions-item label="关联企业" :span="2">{{ getEnterpriseName(project.enterpriseId)
            }}</el-descriptions-item>
            <el-descriptions-item label="项目描述" :span="2">{{ project.description }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 项目进度 -->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <h3>项目进度</h3>
            <el-button type="primary" size="small" @click="handleAddProgress"
              v-if="hasPermission('USER_EDIT')">添加进度</el-button>
          </div>
        </template>
        <div class="progress-section">
          <el-timeline>
            <el-timeline-item v-for="(progress, index) in progressList" :key="index"
              :timestamp="formatDate(progress.createdAt)" :type="getProgressType(progress.status)">
              <el-card class="progress-card">
                <template #header>
                  <div class="progress-header">
                    <h4>{{ progress.title }}</h4>
                    <div class="progress-actions">
                      <el-button type="primary" size="small" @click="handleEditProgress(progress)"
                        v-if="hasPermission('USER_EDIT')">编辑</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteProgress(progress)"
                        v-if="hasPermission('USER_DELETE')">删除</el-button>
                    </div>
                  </div>
                </template>
                <p>{{ progress.description }}</p>
                <div class="progress-status">
                  <span>完成度: {{ progress.completionRate }}%</span>
                  <el-progress :percentage="progress.completionRate"
                    :status="getProgressStatus(progress.status)"></el-progress>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <div class="empty-state" v-if="progressList.length === 0">
            <el-empty description="暂无进度记录"></el-empty>
          </div>
        </div>
      </el-card>

      <!-- 项目资源分配 -->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <h3>项目成员</h3>
            <el-button type="primary" size="small" @click="handleAddResource"
              v-if="hasPermission('USER_EDIT')">添加成员</el-button>
          </div>
        </template>
        <div class="resource-section">
          <el-table :data="resourceList" border>
            <el-table-column label="姓名" min-width="150">
              <template #default="scope">
                {{ scope.row.user ? scope.row.user.realName : '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="角色" width="120">
              <template #default="scope">
                <el-tag :type="getRoleType(scope.row.roleType)">
                  {{ getRoleLabel(scope.row.roleType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="加入日期" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.joinDate) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button type="danger" size="small" @click="handleRemoveResource(scope.row)"
                  v-if="hasPermission('USER_EDIT')">移除</el-button>
                <el-button type="primary" size="small" @click="handleEvaluateUser(scope.row)"
                  v-if="hasPermission('USER_EDIT')">评价</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="empty-state" v-if="resourceList.length === 0">
            <el-empty description="暂无项目成员"></el-empty>
          </div>
        </div>
      </el-card>

      <!-- 项目文档 -->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <h3>项目文档</h3>
            <el-button type="primary" size="small" @click="handleAddDocument"
              v-if="hasPermission('USER_EDIT')">上传文档</el-button>
          </div>
        </template>
        <div class="document-section">
          <el-table :data="documentList" border>
            <el-table-column prop="title" label="文档标题" min-width="200" />
            <el-table-column prop="description" label="文档描述" min-width="300" show-overflow-tooltip />
            <el-table-column label="文件类型" width="120">
              <template #default="scope">
                <el-tag>{{ scope.row.fileType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="上传者" width="120">
              <template #default="scope">
                {{ scope.row.uploader ? scope.row.uploader.realName : '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="上传时间" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleDownloadDocument(scope.row)">下载</el-button>
                <el-button type="danger" size="small" @click="handleDeleteDocument(scope.row)"
                  v-if="hasPermission('USER_DELETE')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="empty-state" v-if="documentList.length === 0">
            <el-empty description="暂无项目文档"></el-empty>
          </div>
        </div>
      </el-card>

      <!-- 项目评价 -->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <h3>项目评价</h3>
          </div>
        </template>
        <div class="evaluation-section">
          <el-table :data="evaluationList" border>
            <el-table-column label="评价人" width="120">
              <template #default="scope">
                {{ scope.row.evaluator ? scope.row.evaluator.realName : '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="被评价人" width="120">
              <template #default="scope">
                {{ scope.row.evaluatee ? scope.row.evaluatee.realName : '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="评分" width="100">
              <template #default="scope">
                <el-rate v-model="scope.row.score" disabled></el-rate>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="评价内容" min-width="300" show-overflow-tooltip />
            <el-table-column label="评价时间" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button type="danger" size="small" @click="handleDeleteEvaluation(scope.row)"
                  v-if="hasPermission('USER_DELETE')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="empty-state" v-if="evaluationList.length === 0">
            <el-empty description="暂无项目评价"></el-empty>
          </div>
        </div>
      </el-card>


      <!-- 进度对话框 -->
      <el-dialog :title="isEditMode ? '编辑进度' : '添加进度'" v-model="progressDialogVisible" width="500px">
        <el-form ref="progressFormRef" :model="progressForm" :rules="progressRules" label-width="100px">
          <el-form-item label="进度标题" prop="title">
            <el-input v-model="progressForm.title" placeholder="请输入进度标题"></el-input>
          </el-form-item>
          <el-form-item label="进度描述" prop="description">
            <el-input v-model="progressForm.description" type="textarea" rows="3" placeholder="请输入进度描述"></el-input>
          </el-form-item>
          <el-form-item label="完成度" prop="completionRate">
            <el-slider v-model="progressForm.completionRate" :step="5" show-input></el-slider>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="progressForm.status" placeholder="请选择状态">
              <el-option label="准备中" :value="0"></el-option>
              <el-option label="进行中" :value="1"></el-option>
              <el-option label="已完成" :value="2"></el-option>
              <el-option label="已延期" :value="3"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="progressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProgressForm">确定</el-button>
        </template>
      </el-dialog>

      <!-- 成员对话框 -->
      <!-- 成员对话框 -->
      <el-dialog title="添加成员" v-model="resourceDialogVisible" width="500px">
        <el-form ref="resourceFormRef" :model="resourceForm" :rules="resourceRules" label-width="100px">
          <el-form-item label="选择成员" prop="userId">
            <el-select v-model="resourceForm.userId" placeholder="请选择成员" filterable>
              <el-option v-for="user in userList" :key="user.id" :label="user.realName || user.username"
                :value="user.id">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ user.realName || user.username }}</span>
                  <span v-if="user.roles && user.roles.length > 0" style="color: #909399; font-size: 13px;">
                    {{ user.roles[0].name.replace('ROLE_', '') }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="resourceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResourceForm">确定</el-button>
        </template>
      </el-dialog>

      <!-- 文档对话框 -->
      <el-dialog title="上传文档" v-model="documentDialogVisible" width="500px">
        <el-form ref="documentFormRef" :model="documentForm" :rules="documentRules" label-width="100px">
          <el-form-item label="文档标题" prop="title">
            <el-input v-model="documentForm.title" placeholder="请输入文档标题"></el-input>
          </el-form-item>
          <el-form-item label="文档描述" prop="description">
            <el-input v-model="documentForm.description" type="textarea" rows="3" placeholder="请输入文档描述"></el-input>
          </el-form-item>
          <el-form-item label="上传文件" prop="file">
            <el-upload action="#" :auto-upload="false" :limit="1" :on-change="file => handleFileChange(file.raw)">
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">请选择要上传的文件</div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="documentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDocumentForm">确定</el-button>
        </template>
      </el-dialog>

      <!-- 评价对话框 -->
      <el-dialog title="添加评价" v-model="evaluationDialogVisible" width="500px">
        <el-form ref="evaluationFormRef" :model="evaluationForm" :rules="evaluationRules" label-width="100px">
          <el-form-item label="被评价人" prop="evaluateeId">
            <el-select v-model="evaluationForm.evaluateeId" placeholder="请选择被评价人">
              <el-option v-for="user in userList" :key="user.id" :label="user.realName" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="评分" prop="score">
            <el-rate v-model="evaluationForm.score" :max="5"></el-rate>
          </el-form-item>
          <el-form-item label="评价内容" prop="content">
            <el-input v-model="evaluationForm.content" type="textarea" rows="4" placeholder="请输入评价内容"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="evaluationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvaluationForm">确定</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 各种对话框... -->
    <!-- 项目编辑对话框 -->
    <!-- 进度添加/编辑对话框 -->
    <!-- 成员添加对话框 -->
    <!-- 文档上传对话框 -->
    <!-- 评价对话框 -->
  </div>
</template>

<script setup>
// 导入必要的组件和API
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getProjectById,
  updateProject,
  getProjectProgress,
  createProjectProgress,
  updateProjectProgress,
  deleteProjectProgress,
  getProjectResources,
  createProjectResource,
  deleteProjectResource,
  getProjectDocuments,
  uploadProjectDocument,
  downloadProjectDocument,
  deleteProjectDocument,
  getProjectEvaluations,
  createProjectEvaluation,
  deleteProjectEvaluation
} from '@/api/project';
import { useAuthStore } from '@/store/auth';
import { getUsers } from '@/api/user';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 项目ID
const projectId = ref(route.params.id);

// 页面数据
const loading = ref(false);
const submitLoading = ref(false); 
const project = ref({});
const progressList = ref([]);
const resourceList = ref([]);
const documentList = ref([]);
const evaluationList = ref([]);

// 企业列表（同上，实际需要从API获取）
const enterprises = ref([
  { id: 1, name: '阿里巴巴' },
  { id: 2, name: '腾讯科技' },
  { id: 3, name: '百度' },
  { id: 4, name: '字节跳动' }
]);

// 修改hasPermission函数
const hasPermission = (permission) => {
  const result = authStore.hasPermission(permission);
  console.log(`检查权限 ${permission}:`, result);
  return result;
};

const userPermissions = computed(() => {
  console.log('当前用户权限:', authStore.user.permissions);
  return authStore.user.permissions || [];
});

// 获取项目详情
const fetchProjectDetail = async () => {
  loading.value = true;
  try {
    const response = await getProjectById(projectId.value);
    if (response.code === 200) {
      project.value = response.data || {};

      // 加载项目进度、资源、文档、评价等相关数据
      // 此处简化，实际需要调用对应的API
      fetchProjectProgress();
      fetchProjectResources();
      fetchProjectDocuments();
      fetchProjectEvaluations();
    } else {
      ElMessage.error(response.message || '获取项目详情失败');
    }
  } catch (error) {
    console.error('获取项目详情失败:', error);
    ElMessage.error('获取项目详情失败');
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
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

// 获取企业名称
const getEnterpriseName = (id) => {
  if (!id) return '未关联';
  const enterprise = enterprises.value.find(item => item.id === id);
  return enterprise ? enterprise.name : `未知企业(ID: ${id})`;
};

// 获取进度类型
const getProgressType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'primary',
    2: 'success',
    3: 'warning'
  };
  return typeMap[status] || 'info';
};

// 获取进度状态
const getProgressStatus = (status) => {
  const statusMap = {
    0: '',
    1: 'active',
    2: 'success',
    3: 'exception'
  };
  return statusMap[status] || '';
};

// 获取角色标签
const getRoleLabel = (roleType) => {
  const roleMap = {
    0: '项目负责人',
    1: '指导教师',
    2: '企业导师',
    3: '学生'
  };
  return roleMap[roleType] || '未知角色';
};

// 获取角色标签类型
const getRoleType = (roleType) => {
  const typeMap = {
    0: 'danger',
    1: 'warning',
    2: 'success',
    3: 'info'
  };
  return typeMap[roleType] || '';
};

// 在script setup部分的状态变量部分添加以下内容
// 对话框控制
const progressDialogVisible = ref(false);
const resourceDialogVisible = ref(false);
const documentDialogVisible = ref(false);
const evaluationDialogVisible = ref(false);
const currentEditItem = ref(null);
const isEditMode = ref(false);

// 表单对象
const progressForm = reactive({
  id: null,
  projectId: projectId.value,
  title: '',
  description: '',
  completionRate: 0,
  status: 0
});

const resourceForm = reactive({
  id: null,
  projectId: projectId.value,
  userId: null
});

const documentForm = reactive({
  id: null,
  projectId: projectId.value,
  title: '',
  description: '',
  fileType: '',
  file: null
});

const evaluationForm = reactive({
  id: null,
  projectId: projectId.value,
  evaluatorId: authStore.user.id,
  evaluateeId: null,
  score: 3,
  content: ''
});

// 用户列表（实际应用中需要从API获取）
const userList = ref([]);

// 获取所有用户的函数
const fetchUsers = async () => {
  try {
    const response = await getUsers();
    if (response.code === 200 && response.data) {
      userList.value = response.data;
    } else {
      console.error('获取用户列表失败:', response.message);
    }
  } catch (error) {
    console.error('获取用户列表请求失败:', error);
    ElMessage.error('获取用户列表失败');
  }
};

// 表单校验规则
const progressRules = {
  title: [
    { required: true, message: '请输入进度标题', trigger: 'blur' }
  ],
  completionRate: [
    { required: true, message: '请输入完成度', trigger: 'blur' }
  ]
};

const resourceRules = {
  userId: [
    { required: true, message: '请选择成员', trigger: 'change' }
  ]
};

const documentRules = {
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' }
  ],
  file: [
    { required: true, message: '请选择文件', trigger: 'change' }
  ]
};

const evaluationRules = {
  evaluateeId: [
    { required: true, message: '请选择被评价人', trigger: 'change' }
  ],
  score: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ]
};

// 表单引用
const progressFormRef = ref(null);
const resourceFormRef = ref(null);
const documentFormRef = ref(null);
const evaluationFormRef = ref(null);

// 编辑项目
const handleEdit = () => {
  // 创建编辑项目的功能实现
  ElMessageBox.prompt('请输入修改后的项目名称', '编辑项目', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: project.value.name,
    inputPattern: /\S+/,
    inputErrorMessage: '项目名称不能为空'
  }).then(({ value }) => {
    // 这里简化处理，实际应该调用API
    project.value.name = value;
    ElMessage.success('项目名称已更新');
  }).catch(() => {
    // 用户取消操作
  });
};

// 进度管理
const handleAddProgress = () => {
  isEditMode.value = false;
  // 重置表单
  Object.assign(progressForm, {
    id: null,
    projectId: projectId.value,
    title: '',
    description: '',
    completionRate: 0,
    status: 0
  });
  progressDialogVisible.value = true;
};

const handleEditProgress = (progress) => {
  isEditMode.value = true;
  currentEditItem.value = progress;

  // 填充表单
  Object.assign(progressForm, {
    id: progress.id,
    projectId: progress.projectId,
    title: progress.title,
    description: progress.description,
    completionRate: progress.completionRate,
    status: progress.status
  });

  progressDialogVisible.value = true;
};

const handleDeleteProgress = (progress) => {
  ElMessageBox.confirm('确定要删除该进度记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteProjectProgress(progress.id);
      if (response.code === 200) {
        ElMessage.success('进度记录已删除');
        fetchProjectProgress(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除进度失败:', error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

const submitProgressForm = async () => {
  if (progressFormRef.value) {
    await progressFormRef.value.validate();

    submitLoading.value = true;
    try {
      let response;
      if (isEditMode.value) {
        // 编辑模式
        response = await updateProjectProgress(projectId.value, progressForm.id, progressForm);
      } else {
        // 添加模式
        response = await createProjectProgress(projectId.value, progressForm);
      }

      if (response.code === 200) {
        ElMessage.success(isEditMode.value ? '进度记录已更新' : '进度记录已添加');
        progressDialogVisible.value = false;
        fetchProjectProgress(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('提交进度表单失败:', error);
      ElMessage.error('操作失败');
    } finally {
      submitLoading.value = false;
    }
  }
};

// 资源管理
const handleAddResource = () => {
  isEditMode.value = false;
  // 重置表单
  Object.assign(resourceForm, {
    id: null,
    projectId: projectId.value,
    userId: null
  });

  // 获取用户列表
  fetchUsers();
  resourceDialogVisible.value = true;
};

const handleRemoveResource = (resource) => {
  ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteProjectResource(resource.id);
      if (response.code === 200) {
        ElMessage.success('成员已移除');
        fetchProjectResources(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '移除失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      ElMessage.error('移除失败');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 获取项目进度数据
const fetchProjectProgress = async () => {
  loading.value = true;
  try {
    const response = await getProjectProgress(projectId.value);
    if (response.code === 200) {
      progressList.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取项目进度失败');
    }
  } catch (error) {
    console.error('获取项目进度数据失败:', error);
    ElMessage.error('获取项目进度数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取项目资源数据
const fetchProjectResources = async () => {
  loading.value = true;
  try {
    const response = await getProjectResources(projectId.value);
    if (response.code === 200) {
      resourceList.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取项目成员失败');
    }
  } catch (error) {
    console.error('获取项目资源数据失败:', error);
    ElMessage.error('获取项目成员失败');
  } finally {
    loading.value = false;
  }
};

// 获取项目文档数据
// 获取项目文档数据
const fetchProjectDocuments = async () => {
  loading.value = true;
  try {
    const response = await getProjectDocuments(projectId.value);
    if (response.code === 200) {
      documentList.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取项目文档失败');
    }
  } catch (error) {
    console.error('获取项目文档数据失败:', error);
    ElMessage.error('获取项目文档失败');
  } finally {
    loading.value = false;
  }
};

// 获取项目评价数据
const fetchProjectEvaluations = async () => {
  loading.value = true;
  try {
    const response = await getProjectEvaluations(projectId.value);
    if (response.code === 200) {
      evaluationList.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取项目评价失败');
    }
  } catch (error) {
    console.error('获取项目评价数据失败:', error);
    ElMessage.error('获取项目评价失败');
  } finally {
    loading.value = false;
  }
};

const handleEvaluateUser = (resource) => {
  // 重置表单
  Object.assign(evaluationForm, {
    id: null,
    projectId: projectId.value,
    evaluatorId: authStore.user.id,
    evaluateeId: resource.userId,
    score: 3,
    content: ''
  });
  evaluationDialogVisible.value = true;
};

const submitResourceForm = async () => {
  if (resourceFormRef.value) {
    await resourceFormRef.value.validate();

    // 获取选中用户信息
    const selectedUser = userList.value.find(user => user.id === resourceForm.userId);

    if (!selectedUser) {
      ElMessage.error('所选用户不存在');
      return;
    }

    // 从用户的角色信息中获取角色类型
    let roleType = 3; // 默认为学生角色
    if (selectedUser.roles && selectedUser.roles.length > 0) {
      // 根据角色名称设置角色类型
      const roleName = selectedUser.roles[0].name;
      if (roleName.includes('ADMIN')) {
        roleType = 0; // 项目负责人
      } else if (roleName.includes('TEACHER')) {
        roleType = 1; // 指导教师
      } else if (roleName.includes('MENTOR')) {
        roleType = 2; // 企业导师
      } else {
        roleType = 3; // 学生
      }
    }

    submitLoading.value = true;
    try {
      const response = await createProjectResource(projectId.value, {
        projectId: projectId.value,
        userId: resourceForm.userId,
        roleType: roleType,
        joinDate: new Date().toISOString().split('T')[0]
      });

      if (response.code === 200) {
        ElMessage.success('成员已添加');
        resourceDialogVisible.value = false;
        fetchProjectResources(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '添加成员失败');
      }
    } catch (error) {
      console.error('提交资源表单失败:', error);
      ElMessage.error('添加成员失败');
    } finally {
      submitLoading.value = false;
    }
  }
};

const submitEvaluationForm = async () => {
  if (evaluationFormRef.value) {
    await evaluationFormRef.value.validate();

    submitLoading.value = true;
    try {
      const response = await createProjectEvaluation(projectId.value, {
        projectId: projectId.value,
        evaluateeId: evaluationForm.evaluateeId,
        score: evaluationForm.score,
        content: evaluationForm.content
      });

      if (response.code === 200) {
        ElMessage.success('评价已提交');
        evaluationDialogVisible.value = false;
        fetchProjectEvaluations(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '提交评价失败');
      }
    } catch (error) {
      console.error('提交评价表单失败:', error);
      ElMessage.error('提交评价失败');
    } finally {
      submitLoading.value = false;
    }
  }
};

// 文档管理
const handleAddDocument = () => {
  isEditMode.value = false;
  // 重置表单
  Object.assign(documentForm, {
    id: null,
    projectId: projectId.value,
    title: '',
    description: '',
    fileType: '',
    file: null
  });
  documentDialogVisible.value = true;
};

const handleFileChange = (file) => {
  documentForm.file = file;
  documentForm.fileType = file.name.split('.').pop().toUpperCase();
};

const handleDownloadDocument = async (document) => {
  try {
    const response = await downloadProjectDocument(document.id);

    // 创建一个Blob对象
    const blob = new Blob([response.data]);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', document.title);
    document.body.appendChild(link);

    // 触发点击
    link.click();

    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    ElMessage.success(`文件 ${document.title} 下载成功`);
  } catch (error) {
    console.error('下载文档失败:', error);
    ElMessage.error('下载文档失败');
  }
};

const handleDeleteDocument = (document) => {
  ElMessageBox.confirm('确定要删除该文档吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteProjectDocument(document.id);
      if (response.code === 200) {
        ElMessage.success('文档已删除');
        fetchProjectDocuments(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

const submitDocumentForm = async () => {
  if (documentFormRef.value) {
    await documentFormRef.value.validate();

    if (!documentForm.file) {
      ElMessage.error('请选择文件');
      return;
    }

    submitLoading.value = true;
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', documentForm.file);
      formData.append('title', documentForm.title);
      formData.append('description', documentForm.description);

      const response = await uploadProjectDocument(projectId.value, formData);

      if (response.code === 200) {
        ElMessage.success('文档已上传');
        documentDialogVisible.value = false;
        fetchProjectDocuments(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '上传文档失败');
      }
    } catch (error) {
      console.error('提交文档表单失败:', error);
      ElMessage.error('上传文档失败');
    } finally {
      submitLoading.value = false;
    }
  }
};

const handleDeleteEvaluation = (evaluation) => {
  ElMessageBox.confirm('确定要删除该评价吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteProjectEvaluation(evaluation.id);
      if (response.code === 200) {
        ElMessage.success('评价已删除');
        fetchProjectEvaluations(); // 重新获取最新数据
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评价失败:', error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {
    // 用户取消操作
  });
};


// 页面加载时获取项目详情
onMounted(() => {
  fetchProjectDetail();
  fetchUsers(); // 初始加载用户列表
});
</script>

<style scoped>
.project-detail {
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

.project-info {
  margin-top: 10px;
}

.progress-card {
  margin-bottom: 10px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-header h4 {
  margin: 0;
}

.progress-status {
  margin-top: 10px;
}

.empty-state {
  padding: 20px 0;
}
</style>