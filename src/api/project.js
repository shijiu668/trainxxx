import request from './request';

// 项目管理API
export function getProjects() {
  return request({
    url: '/projects',
    method: 'get'
  });
}

export function getProjectById(id) {
  return request({
    url: `/projects/${id}`,
    method: 'get'
  });
}

export function getMyCreatedProjects() {
  return request({
    url: '/projects/created-by-me',
    method: 'get'
  });
}

export function getMyParticipatedProjects() {
  return request({
    url: '/projects/participated',
    method: 'get'
  });
}

export function createProject(data) {
  return request({
    url: '/projects',
    method: 'post',
    data
  });
}

export function updateProject(id, data) {
  return request({
    url: `/projects/${id}`,
    method: 'put',
    data
  });
}

export function deleteProject(id) {
  return request({
    url: `/projects/${id}`,
    method: 'delete'
  });
}

// 项目进度API
export function getProjectProgress(projectId) {
  return request({
    url: `/projects/${projectId}/progress`,
    method: 'get'
  });
}

export function createProjectProgress(projectId, data) {
  return request({
    url: `/projects/${projectId}/progress`,
    method: 'post',
    data
  });
}

export function updateProjectProgress(projectId, id, data) {
  return request({
    url: `/projects/${projectId}/progress/${id}`,
    method: 'put',
    data
  });
}

export function deleteProjectProgress(id) {
  return request({
    url: `/projects/progress/${id}`,
    method: 'delete'
  });
}

// 项目资源(成员)API
export function getProjectResources(projectId) {
  return request({
    url: `/projects/${projectId}/resources`,
    method: 'get'
  });
}

export function createProjectResource(projectId, data) {
  return request({
    url: `/projects/${projectId}/resources`,
    method: 'post',
    data
  });
}

export function updateProjectResource(projectId, id, data) {
  return request({
    url: `/projects/${projectId}/resources/${id}`,
    method: 'put',
    data
  });
}

export function deleteProjectResource(id) {
  return request({
    url: `/projects/resources/${id}`,
    method: 'delete'
  });
}

// 项目文档API
export function getProjectDocuments(projectId) {
  return request({
    url: `/projects/${projectId}/documents`,
    method: 'get'
  });
}

export function uploadProjectDocument(projectId, formData) {
  return request({
    url: `/projects/${projectId}/documents`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function downloadProjectDocument(id) {
  return request({
    url: `/projects/documents/${id}/download`,
    method: 'get',
    responseType: 'blob'
  });
}

export function deleteProjectDocument(id) {
  return request({
    url: `/projects/documents/${id}`,
    method: 'delete'
  });
}

// 项目评价API
export function getProjectEvaluations(projectId) {
  return request({
    url: `/projects/${projectId}/evaluations`,
    method: 'get'
  });
}

export function createProjectEvaluation(projectId, data) {
  return request({
    url: `/projects/${projectId}/evaluations`,
    method: 'post',
    data
  });
}

export function updateProjectEvaluation(projectId, id, data) {
  return request({
    url: `/projects/${projectId}/evaluations/${id}`,
    method: 'put',
    data
  });
}

export function deleteProjectEvaluation(id) {
  return request({
    url: `/projects/evaluations/${id}`,
    method: 'delete'
  });
}