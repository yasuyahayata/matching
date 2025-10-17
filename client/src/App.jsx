import React, { useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import socketService from './services/socketService';
import NotificationBell from './components/NotificationBell';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Socket接続
      socketService.connect(token);
      
      // 定期的なping送信（接続維持）
      const pingInterval = setInterval(() => {
        if (socketService.isConnected()) {
          socketService.ping();
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        socketService.disconnect();
      };
    }
  }, []);

  // ブラウザ通知の許可確認
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('通知許可:', permission);
      });
    }
  }, []);

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            通知システム
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          メインコンテンツ
        </Typography>
        <Typography variant="body1">
          リアルタイム通知システムが動作中です。
          右上のベルアイコンから通知を確認できます。
        </Typography>
      </Box>
    </div>
  );
}

export default App;
