const express = require('express');
const router = express.Router();

let messages = [];

router.get('/', (req, res) => {
  res.json({
    success: true,
    messages: messages
  });
});

router.post('/', (req, res) => {
  const { senderId, targetUserId, message } = req.body;
  
  const newMessage = {
    id: Date.now().toString(),
    senderId,
    targetUserId,
    message,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  
  messages.push(newMessage);
  
  res.json({
    success: true,
    message: newMessage
  });
});

module.exports = router;
