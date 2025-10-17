const express = require('express');
const router = express.Router();

let matches = [];

router.get('/', (req, res) => {
  res.json({
    success: true,
    matches: matches
  });
});

router.post('/', (req, res) => {
  const { employerId, applicantId, jobId, jobTitle } = req.body;
  
  const newMatch = {
    id: Date.now().toString(),
    employerId,
    applicantId,
    jobId,
    jobTitle,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  matches.push(newMatch);
  
  res.json({
    success: true,
    match: newMatch
  });
});

module.exports = router;
