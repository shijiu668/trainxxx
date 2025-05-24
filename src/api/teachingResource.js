// 9. api/teachingResource.js
import request from './request';

export function getTeachingResources(params) {
  return request({
    url: '/teaching-resources',
    method: 'get',
    params
  });
}

export function getCourseResources() {
  return request({
    url: '/teaching-resources/courses',
    method: 'get'
  });
}

export function getDocumentResources() {
  return request({
    url: '/teaching-resources/documents',
    method: 'get'
  });
}

export function getTeachingResourceById(id) {
  return request({
    url: `/teaching-resources/${id}`,
    method: 'get'
  });
}

export function createTeachingResource(formData) {
  return request({
    url: '/teaching-resources',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function updateTeachingResource(id, data) {
  return request({
    url: `/teaching-resources/${id}`,
    method: 'put',
    data
  });
}

export function deleteTeachingResource(id) {
  return request({
    url: `/teaching-resources/${id}`,
    method: 'delete'
  });
}

export function downloadTeachingResource(id) {
  return request({
    url: `/teaching-resources/${id}/download`,
    method: 'get',
    responseType: 'blob'
  });
}