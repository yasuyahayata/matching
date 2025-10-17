const express = require('express');
const router = express.Router();

// テスト用の簡単な認証ルート
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // 簡単な模擬認証
  if (email && password) {
    const user = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      token: `mock_token_${Date.now()}`
    };
    
    res.json({
      success: true,
      user,
      message: 'Login successful'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (email && password && name) {
    const user = {
      id: Date.now().toString(),
      email,
      name,
      token: `mock_token_${Date.now()}`
    };
    
    res.json({
      success: true,
      user,
      message: 'Registration successful'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email, password and name required'
    });
  }
});

module.exports = router;
