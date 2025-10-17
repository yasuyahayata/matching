import { useState, useMemo } from 'react';
import { Notification } from '@/types/notification';

export interface NotificationFilters {
  searchTerm: string;
  type: string;
  readStatus: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'createdAt' | 'title' | 'type';
  sortOrder: 'asc' | 'desc';
}

export const useNotificationFilters = (notifications: Notification[]) => {
  const [filters, setFilters] = useState<NotificationFilters>({
    searchTerm: '',
    type: 'all',
    readStatus: 'all',
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      // 検索フィルター
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!notification.title.toLowerCase().includes(searchLower) &&
            !notification.message.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // タイプフィルター
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }

      // 既読/未読フィルター
      if (filters.readStatus === 'read' && !notification.isRead) return false;
      if (filters.readStatus === 'unread' && notification.isRead) return false;

      // 日付範囲フィルター
      if (filters.dateRange.start || filters.dateRange.end) {
        const notificationDate = new Date(notification.createdAt);
        
        if (filters.dateRange.start && notificationDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && notificationDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (aValue < bValue) {
        return filters.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return filters.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [notifications, filters]);

  const updateFilter = (key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      type: 'all',
      readStatus: 'all',
      dateRange: {
        start: null,
        end: null
      },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return {
    filters,
    filteredAndSortedNotifications,
    updateFilter,
    resetFilters
  };
};
