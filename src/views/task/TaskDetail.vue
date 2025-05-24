<template>
    <div class="task-detail">
      <el-page-header @back="goBack" :title="task.title || '任务详情'">
        <template #content>
          <span class="page-header-title">{{ task.title || '加载中...' }}</span>
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
          <div class="task-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务标题">{{ task.title }}</el-descriptions-item>
              <el-descriptions-item label="任务状态">
                <el-tag :type="getStatusType(task.status)">{{ getStatusLabel(task.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始日期">{{ formatDate(task.startDate) }}</el-descriptions-item>
              <el-descriptions-item label="结束日期">{{ formatDate(task.endDate) }}</el-descriptions-item>
              <el-descriptions-item label="指派给">{{ task.assignee ? task.assignee.realName : '未指派' }}</el-descriptions-item>
              <el-descriptions-item label="创建者">{{ task.creator ? task.creator.realName : '未知' }}</el-descriptions-item>
              <el-descriptions-item label="任务描述" :span="2">{{ task.description }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
        
        <!-- 提交列表 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>提交列表</h3>
              <el-button type="primary" size="small" @click="handleAddSubmission">提交任务</el-button>
            </div>
          </template>
          <div class="submission-section">
            <el-table :data="submissionList" border>
              <el-table-column prop="title" label="提交标题" min-width="200" />
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
              <el-table-column label="操作" width="300" fixed="right">
                <template #default="scope">
                  <el-button type="primary" size="small" @click="handleViewSubmission(scope.row)">查看</el-button>
                  <el-button type="success" size="small" @click="handleEvaluateSubmission(scope.row)" v-if="hasPermission('USER_EDIT') && canEvaluate(scope.row)">评价</el-button>
                  <el-button type="warning" size="small" @click="handleUpdateSubmissionStatus(scope.row, 1)" v-if="hasPermission('USER_EDIT') && scope.row.status === 0">通过</el-button>
                  <el-button type="danger" size="small" @click="handleUpdateSubmissionStatus(scope.row, 2)" v-if="hasPermission('USER_EDIT') && scope.row.status === 0">驳回</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="empty-state" v-if="submissionList.length === 0">
              <el-empty description="暂无提交记录"></el-empty>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 任务编辑对话框 -->
      <el-dialog title="编辑任务" v-model="editDialogVisible" width="600px">
        <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="100px">
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
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
      
      <!-- 提交对话框 -->
      <el-dialog title="提交任务" v-model="submissionDialogVisible" width="600px">
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
      
      <!-- 评价对话框 -->
      <el-dialog title="评价提交" v-model="evaluationDialogVisible" width="500px">
        <el-form ref="evaluationFormRef" :model="evaluationForm" :rules="evaluationRules" label-width="100px">
          <el-form-item label="评分" prop="score">
            <el-slider v-model="evaluationForm.score" :min="0" :max="100" :step="5"></el-slider>
            <div class="score-display">{{ evaluationForm.score }}分</div>
          </el-form-item>
          <el-form-item label="评语" prop="comment">
            <el-input v-model="evaluationForm.comment" type="textarea" rows="4" placeholder="请输入评语"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="evaluationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvaluationForm" :loading="evaluationLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getTaskById, updateTask } from '@/api/task';
  import { getSubmissionsByTaskId, createSubmission, updateSubmissionStatus } from '@/api/submission';
  import { createTaskEvaluation } from '@/api/taskEvaluation';
  import { getUsers } from '@/api/user';
  import { useAuthStore } from '@/store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const taskFormRef = ref(null);
  const submissionFormRef = ref(null);
  const evaluationFormRef = ref(null);
  
  // 获取任务ID
  const taskId = ref(route.params.id);
  
  // 数据
  const task = ref({});
  const submissionList = ref([]);
  const users = ref([]);
  const loading = ref(false);
  
  // 对话框控制
  const editDialogVisible = ref(false);
  const submissionDialogVisible = ref(false);
  const evaluationDialogVisible = ref(false);
  const submitLoading = ref(false);
  const submissionLoading = ref(false);
  const evaluationLoading = ref(false);
  
  // 表单对象
  const taskForm = reactive({
    id: null,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 0,
    assignedTo: null
  });
  
  const submissionForm = reactive({
    taskId: null,
    title: '',
    content: '',
    fileUrl: '',
    status: 0
  });
  
  const evaluationForm = reactive({
    submissionId: null,
    score: 80,
    comment: ''
  });
  
  // 表单校验规则
  const taskRules = {
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
  
  const submissionRules = {
    title: [
      { required: true, message: '请输入提交标题', trigger: 'blur' }
    ],
    content: [
      { required: true, message: '请输入提交内容', trigger: 'blur' }
    ]
  };
  
  const evaluationRules = {
    score: [
      { required: true, message: '请设置评分', trigger: 'change' }
    ],
    comment: [
      { required: true, message: '请输入评语', trigger: 'blur' }
    ]
  };
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 判断是否可以评价
  const canEvaluate = (submission) => {
    // 只有已通过的提交才可以评价
    return submission.status === 1;
  };
  
  // 获取任务详情
  const fetchTaskDetail = async () => {
    loading.value = true;
    try {
      const response = await getTaskById(taskId.value);
      if (response.code === 200) {
        task.value = response.data || {};
      } else {
        ElMessage.error(response.message || '获取任务详情失败');
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      ElMessage.error('获取任务详情失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 获取提交列表
  const fetchSubmissions = async () => {
    try {
      const response = await getSubmissionsByTaskId(taskId.value);
      if (response.code === 200) {
        submissionList.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取提交列表失败');
      }
    } catch (error) {
      console.error('获取提交列表失败:', error);
      ElMessage.error('获取提交列表失败');
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
  
  // 返回上一页
  const goBack = () => {
    router.back();
  };
  
  // 编辑任务
  const handleEdit = () => {
    // 填充表单
    Object.assign(taskForm, {
      id: task.value.id,
      title: task.value.title,
      description: task.value.description,
      startDate: formatDate(task.value.startDate),
      endDate: formatDate(task.value.endDate),
      status: task.value.status,
      assignedTo: task.value.assignedTo
    });
    
    editDialogVisible.value = true;
  };
  
  // 提交任务表单
  const submitTaskForm = async () => {
    if (taskFormRef.value) {
      try {
        await taskFormRef.value.validate();
        
        submitLoading.value = true;
        
        const response = await updateTask(taskForm.id, taskForm);
        
        if (response.code === 200) {
          ElMessage.success('更新成功');
          editDialogVisible.value = false;
          fetchTaskDetail();
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
  
  // 添加提交
  const handleAddSubmission = () => {
    // 重置表单
    Object.assign(submissionForm, {
      taskId: taskId.value,
      title: '',
      content: '',
      fileUrl: '',
      status: 0
    });
    
    submissionDialogVisible.value = true;
  };
  
  // 查看提交
  const handleViewSubmission = (row) => {
    router.push(`/submissions/${row.id}`);
  };
  
  // 评价提交
  const handleEvaluateSubmission = (row) => {
    // 重置表单
    Object.assign(evaluationForm, {
      submissionId: row.id,
      score: 80,
      comment: ''
    });
    
    evaluationDialogVisible.value = true;
  };
  
  // 更新提交状态
  const handleUpdateSubmissionStatus = async (row, status) => {
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
  
  // 提交评价表单
  const submitEvaluationForm = async () => {
    if (evaluationFormRef.value) {
      try {
        await evaluationFormRef.value.validate();
        
        evaluationLoading.value = true;
        
        const response = await createTaskEvaluation(evaluationForm);
        
        if (response.code === 200) {
          ElMessage.success('评价提交成功');
          evaluationDialogVisible.value = false;
          fetchSubmissions();
        } else {
          ElMessage.error(response.message || '评价提交失败');
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败，请检查表单数据');
      } finally {
        evaluationLoading.value = false;
      }
    }
  };
  
  // 提交任务提交表单
  const submitSubmissionForm = async () => {
    if (submissionFormRef.value) {
      try {
        await submissionFormRef.value.validate();
        
        submissionLoading.value = true;
        
        const response = await createSubmission(submissionForm);
        
        if (response.code === 200) {
          ElMessage.success('提交成功');
          submissionDialogVisible.value = false;
          fetchSubmissions();
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
  
  // 格式化日期时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
    fetchTaskDetail();
    fetchSubmissions();
    fetchUsers();
  });
  </script>
  
  <style scoped>
  .task-detail {
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
  
  .task-info {
    margin-top: 10px;
  }
  
  .empty-state {
    padding: 20px 0;
  }
  
  .file-info {
    margin-top: 10px;
    color: #409EFF;
  }
  
  .score-display {
    text-align: center;
    margin-top: 5px;
    font-size: 16px;
    font-weight: bold;
  }
  </style>