import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Pagination,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Menu,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Delete,
  MarkEmailRead,
  MarkEmailUnread,
  Search,
  FilterList,
  Refresh,
  MoreVert,
  Info,
  Warning,
  Error,
  CheckCircle,
  Notifications,
  NotificationsOff,
  SelectAll,
  Clear,
  Archive
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import socketService from '../services/socketService';
import notificationAPI from '../services/notificationAPI';

// スタイル付きコンポーネント
const StyledCard = styled(Card)(({ theme, isread }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: isread === 'true' ? theme.palette.background.paper : theme.palette.action.hover,
  border: isread === 'true' ? 'none' : `1px solid ${theme.palette.primary.light}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-1px)'
  }
}));

const TypeIcon = styled(Avatar)(({ theme, notificationtype }) => {
  const getTypeStyles = (type) => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText
        };
      case 'warning':
        return {
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText
        };
      case 'success':
        return {
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText
        };
      default:
        return {
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText
        };
    }
  };

  return {
    width: 32,
    height: 32,
    ...getTypeStyles(notificationtype)
  };
});

const NotificationList = () => {
  // 状態管理
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, notificationId: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 10;

  // 通知アイコンの取得
  const getTypeIcon = (type) => {
    switch (type) {
      case 'error': return <Error fontSize="small" />;
      case 'warning': return <Warning fontSize="small" />;
      case 'success': return <CheckCircle fontSize="small" />;
      default: return <Info fontSize="small" />;
    }
  };

  // 時刻フォーマット
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}日前`;
    
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 通知読み込み
  const loadNotifications = useCallback(async (pageNum = 1, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await notificationAPI.getNotifications(pageNum, limit);
      let notificationsData = response.data.data || [];

      // フィルター適用
      if (searchTerm) {
        notificationsData = notificationsData.filter(notification =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterType !== 'all') {
        notificationsData = notificationsData.filter(notification =>
          notification.type === filterType
        );
      }

      if (filterRead !== 'all') {
        notificationsData = notificationsData.filter(notification =>
          filterRead === 'read' ? notification.isRead : !notification.isRead
        );
      }

      setNotifications(notificationsData);
      setTotalPages(Math.ceil(notificationsData.length / limit));
      setPage(pageNum);
    } catch (error) {
      console.error('通知の取得に失敗:', error);
      setError('通知の取得に失敗しました');
      showSnackbar('通知の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filterType, filterRead, limit]);

  // 初期読み込み
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Socket通知リスナー
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      showSnackbar('新しい通知が届きました', 'info');
    };

    socketService.on('newNotification', handleNewNotification);

    return () => {
      socketService.off('newNotification', handleNewNotification);
    };
  }, []);

  // スナックバー表示
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // リフレッシュ
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(1, false);
    showSnackbar('通知を更新しました', 'success');
  };

  // 既読/未読切り替え
  const handleToggleRead = async (notificationId, currentReadStatus) => {
    try {
      if (!currentReadStatus) {
        await notificationAPI.markAsRead(notificationId);
      }
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: !currentReadStatus } : n
        )
      );
      
      showSnackbar(
        currentReadStatus ? '未読にしました' : '既読にしました',
        'success'
      );
    } catch (error) {
      console.error('既読状態の更新に失敗:', error);
      showSnackbar('既読状態の更新に失敗しました', 'error');
    }
  };

  // 全て既読
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      showSnackbar('全ての通知を既読にしました', 'success');
    } catch (error) {
      console.error('全既読の更新に失敗:', error);
      showSnackbar('全既読の更新に失敗しました', 'error');
    }
  };

  // 通知削除
  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
      setDeleteDialog({ open: false, notificationId: null });
      showSnackbar('通知を削除しました', 'success');
    } catch (error) {
      console.error('通知の削除に失敗:', error);
      showSnackbar('通知の削除に失敗しました', 'error');
    }
  };

  // 選択関連
  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  // 選択した通知の一括操作
  const handleBulkMarkAsRead = async () => {
    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationAPI.markAsRead(id)
      );
      await Promise.all(promises);
      
      setNotifications(prev =>
        prev.map(n =>
          selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
        )
      );
      
      setSelectedNotifications(new Set());
      showSnackbar(`${selectedNotifications.size}件の通知を既読にしました`, 'success');
    } catch (error) {
      console.error('一括既読の更新に失敗:', error);
      showSnackbar('一括既読の更新に失敗しました', 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationAPI.deleteNotification(id)
      );
      await Promise.all(promises);
      
      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.has(n.id))
      );
      
      setSelectedNotifications(new Set());
      showSnackbar(`${selectedNotifications.size}件の通知を削除しました`, 'success');
    } catch (error) {
      console.error('一括削除に失敗:', error);
      showSnackbar('一括削除に失敗しました', 'error');
    }
  };

  // メニューハンドラー
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // 統計情報
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" />
          通知管理
          <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }}>
            <Box />
          </Badge>
        </Typography>
        
        {/* 統計情報 */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip 
            label={`全体: ${totalCount}件`} 
            variant="outlined" 
            color="default"
          />
          <Chip 
            label={`未読: ${unreadCount}件`} 
            variant="outlined" 
            color="error"
          />
          <Chip 
            label={`既読: ${totalCount - unreadCount}件`} 
            variant="outlined" 
            color="success"
          />
        </Stack>
      </Box>

      {/* 検索・フィルター */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="通知を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>種類</InputLabel>
              <Select
                value={filterType}
                label="種類"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">全て</MenuItem>
                <MenuItem value="info">情報</MenuItem>
                <MenuItem value="success">成功</MenuItem>
                <MenuItem value="warning">警告</MenuItem>
                <MenuItem value="error">エラー</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>状態</InputLabel>
              <Select
                value={filterRead}
                label="状態"
                onChange={(e) => setFilterRead(e.target.value)}
              >
                <MenuItem value="all">全て</MenuItem>
                <MenuItem value="unread">未読</MenuItem>
                <MenuItem value="read">既読</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* アクションボタン */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              startIcon={refreshing ? <Refresh className="spin" /> : <Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              更新
            </Button>
            
            <Button
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              size="small"
            >
              全て既読
            </Button>
            
            <Button
              startIcon={<SelectAll />}
              onClick={handleSelectAll}
              size="small"
            >
              {selectedNotifications.size === notifications.length ? '全選択解除' : '全選択'}
            </Button>

            {selectedNotifications.size > 0 && (
              <>
                <Button
                  startIcon={<MarkEmailRead />}
                  onClick={handleBulkMarkAsRead}
                  color="primary"
                  size="small"
                >
                  選択を既読
                </Button>
                <Button
                  startIcon={<Delete />}
                  onClick={handleBulkDelete}
                  color="error"
                  size="small"
                >
                  選択を削除
                </Button>
              </>
            )}

            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVert />
            </IconButton>
          </Stack>
        </Stack>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 通知リスト */}
      {loading ? (
        <Box>
          {[...Array(5)].map((_, index) => (
            <Card key={index} sx={{ mb: 1, p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={32} height={32} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="circular" width={24} height={24} />
              </Stack>
            </Card>
          ))}
        </Box>
      ) : notifications.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            通知がありません
          </Typography>
          <Typography variant="body2" color="textSecondary">
            フィルター条件を変更するか、新しい通知をお待ちください
          </Typography>
        </Card>
      ) : (
        <Box>
          {notifications.map((notification) => (
            <StyledCard 
              key={notification.id}
              isread={notification.isRead.toString()}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* 選択チェックボックス */}
                  <IconButton
                    size="small"
                    onClick={() => handleSelectNotification(notification.id)}
                    color={selectedNotifications.has(notification.id) ? 'primary' : 'default'}
                  >
                    {selectedNotifications.has(notification.id) ? <CheckCircle /> : <SelectAll />}
                  </IconButton>

                  {/* 通知アイコン */}
                  <TypeIcon notificationtype={notification.type}>
                    {getTypeIcon(notification.type)}
                  </TypeIcon>

                  {/* 通知内容 */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                          flexGrow: 1
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.type}
                        size="small"
                        color={
                          notification.type === 'error' ? 'error' :
                          notification.type === 'warning' ? 'warning' :
                          notification.type === 'success' ? 'success' : 'info'
                        }
                        variant="outlined"
                      />
                    </Stack>

                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ mb: 1, wordBreak: 'break-word' }}
                    >
                      {notification.message}
                    </Typography>

                    <Typography variant="caption" color="textSecondary">
                      {formatDateTime(notification.createdAt)}
                    </Typography>

                    {/* 追加データがある場合 */}
                    {notification.data && Object.keys(notification.data).length > 0 && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          関連データ: {JSON.stringify(notification.data)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* アクションボタン */}
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={notification.isRead ? '未読にする' : '既読にする'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRead(notification.id, notification.isRead)}
                        color={notification.isRead ? 'default' : 'primary'}
                      >
                        {notification.isRead ? <MarkEmailUnread /> : <MarkEmailRead />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          notificationId: notification.id 
                        })}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </StyledCard>
          ))}
        </Box>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => loadNotifications(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* メニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); loadNotifications(); }}>
          <Refresh sx={{ mr: 1 }} />
          リフレッシュ
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); handleMarkAllAsRead(); }}>
          <MarkEmailRead sx={{ mr: 1 }} />
          全て既読にする
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); setSelectedNotifications(new Set()); }}>
          <Clear sx={{ mr: 1 }} />
          選択をクリア
        </MenuItem>
      </Menu>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, notificationId: null })}
      >
        <DialogTitle>通知の削除</DialogTitle>
        <DialogContent>
          <Typography>
            この通知を削除してもよろしいですか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, notificationId: null })}
          >
            キャンセル
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialog.notificationId)}
            color="error"
            variant="contained"
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* カスタムCSS（回転アニメーション） */}
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default NotificationList;
