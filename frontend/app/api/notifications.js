// app/api/notifications.js
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const NotificationsAPI = {
  // Get all notifications for the current user
  list: () => apiGet("/api/notifications/"),
  
  // Mark a notification as read
  markAsRead: (id) => apiPatch(`/api/notifications/${id}/`, { read: true }),
  
  // Mark all notifications as read
  markAllAsRead: () => apiPost("/api/notifications/mark-all-read/"),
  
  // Delete a notification
  delete: (id) => apiDelete(`/api/notifications/${id}/`),
  
  // Get unread notifications count
  getUnreadCount: () => apiGet("/api/notifications/unread-count/"),
};