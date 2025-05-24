import request from './request';

export function getPermissions() {
  return request({
    url: '/permissions',
    method: 'get'
  });
}

export function getPermissionById(id) {
  return request({
    url: `/permissions/${id}`,
    method: 'get'
  });
}

export function getPermissionsByRoleId(roleId) {
  return request({
    url: `/permissions/role/${roleId}`,
    method: 'get'
  });
}

export function getPermissionsByUserId(userId) {
  return request({
    url: `/permissions/user/${userId}`,
    method: 'get'
  });
}