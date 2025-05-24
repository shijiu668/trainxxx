import request from './request';

// 获取所有任务
export function getTasks() {
  return request({
    url: '/tasks',
    method: 'get'
  });
}

// 获取任务详情
export function getTaskById(id) {
  return request({
    url: `/tasks/${id}`,
    method: 'get'
  });
}

// 根据项目ID获取任务
export function getTasksByProjectId(projectId) {
  return request({
    url: `/tasks/project/${projectId}`,
    method: 'get'
  });
}

// 获取分配给我的任务
export function getTasksAssignedToMe() {
  return request({
    url: '/tasks/assigned-to-me',
    method: 'get'
  });
}

// 获取我创建的任务
export function getTasksCreatedByMe() {
  return request({
    url: '/tasks/created-by-me',
    method: 'get'
  });
}

// 创建任务
export function createTask(data) {
  return request({
    url: '/tasks',
    method: 'post',
    data
  });
}

// 更新任务
export function updateTask(id, data) {
  return request({
    url: `/tasks/${id}`,
    method: 'put',
    data
  });
}

// 更新任务状态
export function updateTaskStatus(id, status) {
  return request({
    url: `/tasks/${id}/status`,
    method: 'put',
    params: { status }
  });
}

// 删除任务
export function deleteTask(id) {
  return request({
    url: `/tasks/${id}`,
    method: 'delete'
  });
}