import React from 'react';
import {
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Notification } from '@/types/notification';

interface NotificationCardProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
  isProcessing
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case 'success':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      default:
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className={`rounded-lg border p-4 transition-all duration-200 ${
      !notification.isRead 
        ? 'bg-blue-50 border-blue-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-start space-x-3">
        {/* 選択チェックボックス */}
        <div className="flex items-center h-5 mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(notification.id)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>

        {/* アイコン */}
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-sm font-medium text-gray-900 ${
                  !notification.isRead ? 'font-semibold' : ''
                }`}>
                  {notification.title}
                </h3>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  getTypeStyles(notification.type)
                }`}>
                  {notification.type}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatTime(notification.createdAt)}
                </span>
                
                {!notification.isRead && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    未読
                  </span>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col space-y-1 ml-4">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={isProcessing}
                  className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  title="既読にする"
                >
                  <CheckIcon className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                disabled={isProcessing}
                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                title="削除"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 追加データ */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="mt-3 p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-1">関連データ:</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-20 overflow-y-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
