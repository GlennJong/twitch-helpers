const STREAMING_USER = '<user_name>';
const STREAMING_DC_WEBHOOK = '<discord_webhook>';

function routineMainCheckLiveStatus() {
  const token = getAppAccessToken(); // 確保你有這個獲取 Token 的函式
  const BROADCASTER_ID = getTwitchIdByName(STREAMING_USER);
  
  // 1. 查詢 Twitch API: 該頻道現在是否直播中？
  const url = `https://api.twitch.tv/helix/streams?user_id=${BROADCASTER_ID}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Client-ID': CONFIG.CLIENT_ID,
        'Authorization': `Bearer ${token}`
      },
      muteHttpExceptions: true
    });
    
    const json = JSON.parse(response.getContentText());
    
    // 2. 取得 GAS 內部記憶的「上次實況 ID」
    const scriptProperties = PropertiesService.getScriptProperties();
    const lastStreamId = scriptProperties.getProperty('LAST_STREAM_ID');

    // -------------------------------------------
    // 情況 A: 實況主正在開台中 (data 陣列不為空)
    // -------------------------------------------
    if (json.data && json.data.length > 0) {
      const streamData = json.data[0];
      const currentStreamId = streamData.id;

      // 比對 ID：如果是新的實況，才發通知
      if (currentStreamId !== lastStreamId) {
        console.log(`🎥 偵測到新開台！ID: ${currentStreamId} | 標題: ${streamData.title}`);
        
        // 發送 Discord
        sendLiveNotificationToDiscord(streamData);
        
        // 更新記憶
        scriptProperties.setProperty('LAST_STREAM_ID', currentStreamId);
      } else {
        console.log(`💤 實況中 (ID: ${currentStreamId})，但已經通知過了，跳過。`);
      }
    } 
    // -------------------------------------------
    // 情況 B: 實況主沒開台 (data 為空)
    // -------------------------------------------
    else {
      console.log('📭 目前未開台。');
      
      // 如果之前記著某個 ID，代表剛關台
      // 我們可以選擇清空記憶，確保下次開台（就算 ID 很奇怪地重複）也能通知
      // 或者不清空也沒關係，因為新開台通常 ID 會變
      if (lastStreamId) {
         console.log('偵測到已關台，清除記憶狀態。');
         scriptProperties.deleteProperty('LAST_STREAM_ID');
      }
    }

  } catch (e) {
    console.error('❌ 檢查開台狀態時發生錯誤:', e);
  }
}

// 專用的 Discord 直播通知發送器
function sendLiveNotificationToDiscord(stream) {
  if (!STREAMING_DC_WEBHOOK) return;

  // 替換縮圖網址的大小變數
  const thumbUrl = stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720');

  const payload = {
    content: `@here 🔴 **${stream.user_name}** 開台囉！`, // 可用 @everyone 或 @here
    embeds: [{
      title: stream.title,
      url: `https://www.twitch.tv/${stream.user_login}`,
      color: 9520895, // Twitch Purple
      image: { url: `${thumbUrl}?t=${new Date().getTime()}` }, // 加時間戳記防止縮圖快取舊的
      fields: [
        { name: 'Game', value: stream.game_name || 'Just Chatting', inline: true },
        { name: 'Viewers', value: String(stream.viewer_count), inline: true }
      ],
      footer: { text: `Stream ID: ${stream.id}` },
      timestamp: new Date().toISOString()
    }]
  };

  UrlFetchApp.fetch(STREAMING_DC_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
