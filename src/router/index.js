// Vue Router 的核心函数，用于创建路由实例
import { createRouter, createWebHistory } from 'vue-router';
// 从认证 API 中导入的函数，用于获取当前登录用户信息
import { getUserInfo } from '@/api/auth';

// 路由组件
import Login from '@/views/Login.vue';
import Layout from '@/views/Layout.vue';
import Dashboard from '@/views/Dashboard.vue';
import UserManagement from '@/views/UserManagement.vue';
import RoleManagement from '@/views/RoleManagement.vue';
import NotFound from '@/views/NotFound.vue';


// 路由表
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理', requiresAuth: true, permission: 'USER_VIEW' }
      },
      {
        path: 'roles',
        name: 'RoleManagement',
        component: RoleManagement,
        meta: { title: '角色管理', requiresAuth: true, permission: 'USER_VIEW' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '404', requiresAuth: false }
  },

  {
    path: '/projects',
    component: Layout,
    children: [
      {
        path: '',
        name: 'ProjectList',
        component: () => import('@/views/project/ProjectList.vue'),
        meta: { title: '项目列表', requiresAuth: true, permission: 'USER_VIEW' }
      },
      {
        path: ':id',
        name: 'ProjectDetail',
        component: () => import('@/views/project/ProjectDetail.vue'),
        meta: { title: '项目详情', requiresAuth: true, permission: 'USER_VIEW' }
      }
    ]
  },

  // 任务管理路由
{
  path: '/tasks',
  component: Layout,
  children: [
    {
      path: '',
      name: 'TaskList',
      component: () => import('@/views/task/TaskList.vue'),
      meta: { title: '任务列表', requiresAuth: true, permission: 'USER_VIEW' }
    },
    {
      path: ':id',
      name: 'TaskDetail',
      component: () => import('@/views/task/TaskDetail.vue'),
      meta: { title: '任务详情', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 在路由配置中添加或修改
{
  path: '/tasks/assigned-to-me',
  component: Layout,
  children: [
    {
      path: '',
      name: 'AssignedTasks',
      component: () => import('@/views/task/AssignedTasks.vue'),
      meta: { title: '我的任务', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},
{
  path: '/task-evaluations',
  component: Layout,
  children: [
    {
      path: '',
      name: 'TaskEvaluationList',
      component: () => import('@/views/evaluation/TaskEvaluationList.vue'),
      meta: { title: '实训评价', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 提交管理路由
{
  path: '/submissions',
  component: Layout,
  children: [
    {
      path: '',
      name: 'SubmissionList',
      component: () => import('@/views/submission/SubmissionList.vue'),
      meta: { title: '提交列表', requiresAuth: true, permission: 'USER_VIEW' }
    },
    {
      path: ':id',
      name: 'SubmissionDetail',
      component: () => import('@/views/submission/SubmissionDetail.vue'),
      meta: { title: '提交详情', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 企业资源管理路由
{
  path: '/enterprises',
  component: Layout,
  children: [
    {
      path: '',
      name: 'EnterpriseList',
      component: () => import('@/views/enterprise/EnterpriseList.vue'),
      meta: { title: '企业管理', requiresAuth: true, permission: 'USER_VIEW' }
    },
    {
      path: ':id',
      name: 'EnterpriseDetail',
      component: () => import('@/views/enterprise/EnterpriseDetail.vue'),
      meta: { title: '企业详情', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 企业导师管理路由
{
  path: '/enterprise-mentors',
  component: Layout,
  children: [
    {
      path: '',
      name: 'EnterpriseMentorList',
      component: () => import('@/views/enterprise/EnterpriseMentorList.vue'),
      meta: { title: '企业导师', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 项目模板管理路由
{
  path: '/project-templates',
  component: Layout,
  children: [
    {
      path: '',
      name: 'ProjectTemplateList',
      component: () => import('@/views/enterprise/ProjectTemplateList.vue'),
      meta: { title: '项目库', requiresAuth: true, permission: 'USER_VIEW' }
    },
    {
      path: ':id',
      name: 'ProjectTemplateDetail',
      component: () => import('@/views/enterprise/ProjectTemplateDetail.vue'),
      meta: { title: '项目模板详情', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 14. 更新路由配置
// 在教学资源路由中添加详情页路由

// 教学资源路由
{
  path: '/teaching-resources',
  component: Layout,
  children: [
    {
      path: '',
      name: 'TeachingResourceList',
      component: () => import('@/views/teaching/TeachingResourceList.vue'),
      meta: { title: '教学资源', requiresAuth: true, permission: 'USER_VIEW' }
    },
    {
      path: ':id',
      name: 'TeachingResourceDetail',
      component: () => import('@/views/teaching/TeachingResourceDetail.vue'),
      meta: { title: '资源详情', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
},

// 在router/index.js中添加统计分析路由
{
  path: '/statistics',
  component: Layout,
  children: [
    {
      path: '',
      name: 'StatisticsDashboard',
      component: () => import('@/views/statistics/StatisticsDashboard.vue'),
      meta: { title: '统计分析', requiresAuth: true, permission: 'USER_VIEW' }
    }
  ]
}
];





// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置标题
  document.title = to.meta.title ? `${to.meta.title} - 校企合作实训管理系统` : '校企合作实训管理系统';
  
  // 判断是否需要登录权限
  if (to.meta.requiresAuth) {
    // 获取用户信息
    const user = getUserInfo();
    const token = localStorage.getItem('token');
    
    if (!token) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
    
    // 判断是否有权限访问
    if (to.meta.permission && (!user.permissions || !user.permissions.includes(to.meta.permission))) {
      next({ name: 'Dashboard' });
      return;
    }
    
    next();
  } else {
    // 不需要登录权限的页面
    next();
  }
});

export default router;