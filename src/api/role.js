import request from './request';

export function getRoles() {
  return request({
    url: '/roles',
    method: 'get'
  });
}

export function getRoleById(id) {
  return request({
    url: `/roles/${id}`,
    method: 'get'
  });
}

export function createRole(data) {
  return request({
    url: '/roles',
    method: 'post',
    data
  });
}

export function updateRole(id, data) {
  return request({
    url: `/roles/${id}`,
    method: 'put',
    data
  });
}

export function deleteRole(id) {
  return request({
    url: `/roles/${id}`,
    method: 'delete'
  });
}

export function assignPermissions(roleId, permissionIds) {
  return request({
    url: `/roles/${roleId}/permissions`,
    method: 'post',
    data: permissionIds
  });
}