function getTwitchIdByName(username) {
  const token = getAppAccessToken(); // 重用之前的 Token 函式
  
  // Twitch API: Get Users
  const url = `https://api.twitch.tv/helix/users?login=${username}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Client-ID': TWITCH_CONFIG.CLIENT_ID,
        'Authorization': `Bearer ${token}`
      },
      muteHttpExceptions: true
    });
    
    const json = JSON.parse(response.getContentText());
    
    if (json.data && json.data.length > 0) {
      const userId = json.data[0].id;
      console.log(`🔍 查詢成功: ${username} => ID: ${userId}`);
      return userId;
    } else {
      console.error(`❌ 找不到使用者: ${username}`);
      return null;
    }
  } catch (e) {
    console.error('查詢 ID 失敗:', e);
    return null;
  }
}

function getAppAccessToken() {
  const url = 'https://id.twitch.tv/oauth2/token';
  const payload = {
    client_id: TWITCH_CONFIG.CLIENT_ID,
    client_secret: TWITCH_CONFIG.CLIENT_SECRET,
    grant_type: 'client_credentials'
  };
  
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    payload: payload
  });
  
  return JSON.parse(response.getContentText()).access_token;
}
