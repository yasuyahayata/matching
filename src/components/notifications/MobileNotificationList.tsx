import React from 'react';
import { Notification } from '@/types/notification';
import NotificationCard from './NotificationCard';

interface MobileNotificationListProps {
  notifications: Notification[];
  selectedNotifications: Set<string>;
  onSelectNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
}

const MobileNotificationList: React.FC<MobileNotificationListProps> = ({
  notifications,
  selectedNotifications,
  onSelectNotification,
  onMarkAsRead,
  onDelete,
  isProcessing
}) => {
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          isSelected={selectedNotifications.has(notification.id)}
          onSelect={onSelectNotification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};

export default MobileNotificationList;
