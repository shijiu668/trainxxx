import request from './request';

// 获取项目模板列表
export function getProjectTemplates() {
  return request({
    url: '/project-templates',
    method: 'get'
  });
}

// 获取项目模板详情
export function getProjectTemplateById(id) {
  return request({
    url: `/project-templates/${id}`,
    method: 'get'
  });
}

// 获取企业下的项目模板列表
export function getTemplatesByEnterpriseId(enterpriseId) {
  return request({
    url: `/project-templates/enterprise/${enterpriseId}`,
    method: 'get'
  });
}

// 创建项目模板
export function createProjectTemplate(data) {
  return request({
    url: '/project-templates',
    method: 'post',
    data
  });
}

// 更新项目模板
export function updateProjectTemplate(id, data) {
  return request({
    url: `/project-templates/${id}`,
    method: 'put',
    data
  });
}

// 删除项目模板
export function deleteProjectTemplate(id) {
  return request({
    url: `/project-templates/${id}`,
    method: 'delete'
  });
}