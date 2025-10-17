import React from 'react';

const SimpleTestPage = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green', fontSize: '2em' }}>
        ✅ テストページが表示されました！
      </h1>
      <p style={{ fontSize: '1.2em', margin: '20px 0' }}>
        Next.jsのルーティングが正常に動作しています。
      </p>
      
      <div style={{ 
        backgroundColor: '#f0f8ff', 
        padding: '15px', 
        border: '1px solid #ccc', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h2>動作確認:</h2>
        <ul>
          <li>✅ TypeScriptファイルが認識された</li>
          <li>✅ Reactコンポーネントが表示された</li>
          <li>✅ pagesディレクトリのルーティングが動作した</li>
        </ul>
      </div>
      
      <p style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          ← ホームページに戻る
        </a>
      </p>
    </div>
  );
};

export default SimpleTestPage;
