import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';

const NotificationsPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  // 状態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const itemsPerPage = 10;

  // 認証チェック
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // 初期データ読み込み
  useEffect(() => {
    if (session) {
      loadNotifications();
    }
  }, [session, loadNotifications]);

  // フィルタリング処理
  const filteredNotifications = notifications.filter(notification => {
    // 検索フィルター
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!notification.title.toLowerCase().includes(searchLower) &&
          !notification.message.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // タイプフィルター
    if (filterType !== 'all' && notification.type !== filterType) {
      return false;
    }

    // 既読/未読フィルター
    if (filterRead === 'read' && !notification.isRead) return false;
    if (filterRead === 'unread' && notification.isRead) return false;

    return true;
  });

  // ページネーション
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  // アイコン取得
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

  // スタイル取得
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

  // 時刻フォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ja-JP'),
      time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}日前`;
    return `${Math.floor(diff / 604800000)}週間前`;
  };

  // イベントハンドラー
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsProcessing(true);
      await markAsRead(notificationId);
    } catch (error) {
      console.error('既読の更新に失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsProcessing(true);
      await markAllAsRead();
    } catch (error) {
      console.error('全既読の更新に失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setIsProcessing(true);
      await deleteNotification(notificationId);
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('通知の削除に失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsProcessing(true);
      const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
      await Promise.all(promises);
      setSelectedNotifications(new Set());
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error('一括削除に失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      setIsProcessing(true);
      const promises = Array.from(selectedNotifications).map(id => markAsRead(id));
      await Promise.all(promises);
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('一括既読の更新に失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 選択関連
  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === paginatedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(paginatedNotifications.map(n => n.id)));
    }
  };

  // ページネーション
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedNotifications(new Set());
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <Head>
        <title>通知管理 - Crowd MVP</title>
        <meta name="description" content="通知の管理と履歴を確認できます" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ヘッダー */}
          <div className="py-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl">
                  通知管理
                </h1>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>全体: {filteredNotifications.length}件</span>
                  <span className="mx-2">|</span>
                  <span className="text-red-600">未読: {unreadCount}件</span>
                  <span className="mx-2">|</span>
                  <span className="text-green-600">既読: {filteredNotifications.length - unreadCount}件</span>
                </div>
              </div>
              <div className="mt-4 flex md:ml-4 md:mt-0">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isProcessing}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  >
                    <CheckIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    全て既読にする
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 検索・フィルター */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 検索 */}
                <div className="lg:col-span-2">
                  <label htmlFor="search" className="sr-only">
                    検索
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      type="text"
                      placeholder="通知を検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* タイプフィルター */}
                <div>
                  <label htmlFor="type-filter" className="sr-only">
                    タイプで絞り込み
                  </label>
                  <select
                    id="type-filter"
                    name="type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">全ての種類</option>
                    <option value="info">情報</option>
                    <option value="success">成功</option>
                    <option value="warning">警告</option>
                    <option value="error">エラー</option>
                  </select>
                </div>

                {/* 既読/未読フィルター */}
                <div>
                  <label htmlFor="read-filter" className="sr-only">
                    既読状態で絞り込み
                  </label>
                  <select
                    id="read-filter"
                    name="read-filter"
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">全ての状態</option>
                    <option value="unread">未読のみ</option>
                    <option value="read">既読のみ</option>
                  </select>
                </div>
              </div>

              {/* 一括操作 */}
              {selectedNotifications.size > 0 && (
                <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm text-blue-700">
                      {selectedNotifications.size}件を選択中
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkMarkAsRead}
                      disabled={isProcessing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <CheckIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      既読にする
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={isProcessing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <TrashIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 通知リスト */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">通知がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  フィルター条件を変更するか、新しい通知をお待ちください。
                </p>
              </div>
            ) : (
              <>
                {/* テーブルヘッダー（デスクトップ） */}
                <div className="hidden sm:block">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="flex items-center h-5">
                        <input
                          id="select-all"
                          name="select-all"
                          type="checkbox"
                          checked={selectedNotifications.size === paginatedNotifications.length && paginatedNotifications.length > 0}
                          onChange={handleSelectAll}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        通知
                      </div>
                    </div>
                  </div>
                </div>

                {/* 通知一覧 */}
                <ul className="divide-y divide-gray-200">
                  {paginatedNotifications.map((notification) => {
                    const dateTime = formatDateTime(notification.createdAt);
                    
                    return (
                      <li key={notification.id} className={`${!notification.isRead ? 'bg-blue-50' : 'bg-white'}`}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-start space-x-3">
                            {/* 選択チェックボックス */}
                            <div className="flex items-center h-5">
                              <input
                                id={`notification-${notification.id}`}
                                name={`notification-${notification.id}`}
                                type="checkbox"
                                checked={selectedNotifications.has(notification.id)}
                                onChange={() => handleSelectNotification(notification.id)}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>

                            {/* アイコン */}
                            <div className="flex-shrink-0">
                              {getTypeIcon(notification.type)}
                            </div>

                            {/* コンテンツ */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                      {notification.title}
                                    </p>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeStyles(notification.type)}`}>
                                      {notification.type}
                                    </span>
                                    {!notification.isRead && (
                                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                        未読
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                                    <span>{dateTime.relative}</span>
                                    <span>{dateTime.date} {dateTime.time}</span>
                                  </div>
                                </div>

                                {/* アクションボタン */}
                                <div className="flex items-center space-x-2">
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={isProcessing}
                                      className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                      title="既読にする"
                                    >
                                      <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setShowDeleteDialog(notification.id)}
                                    disabled={isProcessing}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    title="削除"
                                  >
                                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>

                              {/* 追加データ表示 */}
                              {notification.data && Object.keys(notification.data).length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                  <p className="text-xs text-gray-500 mb-2">関連データ:</p>
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {JSON.stringify(notification.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  前へ
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{startIndex + 1}</span>
                    {' '}〜{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredNotifications.length)}
                    </span>
                    {' '}件 (全{' '}
                    <span className="font-medium">{filteredNotifications.length}</span>
                    {' '}件中)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">前のページ</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* ページ番号 */}
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">次のページ</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteDialog && (
          <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                          通知を削除
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            この通知を削除してもよろしいですか？この操作は取り消せません。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      onClick={() => handleDelete(showDeleteDialog)}
                      disabled={isProcessing}
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                    >
                      削除
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteDialog(null)}
                      disabled={isProcessing}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 一括削除確認ダイアログ */}
        {showBulkDeleteDialog && (
          <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                          選択した通知を削除
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            選択した{selectedNotifications.size}件の通知を削除してもよろしいですか？この操作は取り消せません。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={isProcessing}
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                    >
                      削除
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteDialog(false)}
                      disabled={isProcessing}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;
