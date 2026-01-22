function syncClipsToSheet(name) {
  const sheet = getDbSheet(name);
  
  // 1. 取得 Twitch ID
  const broadcasterId = getTwitchIdByName(name); // 呼叫之前的工具函式
  if (!broadcasterId) return;

  // 2. 抓取 Twitch 剪輯
  const token = getAppAccessToken();
  const days = 1; // 1 天
  const startDate = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000)).toISOString();
  const endDate = new Date().toISOString();
  
  const url = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&started_at=${startDate}&ended_at=${endDate}&first=50`;
  
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Client-ID': TWITCH_CONFIG.CLIENT_ID, 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  });
  const clips = JSON.parse(response.getContentText()).data;

  if (!clips || clips.length === 0) {
    console.log('📭 沒有抓到任何剪輯。');
    return;
  }

  // 3. 讀取 Sheet 目前已有的 Clip ID (避免重複寫入)
  // A 欄是 ID，我們讀取整欄
  const lastRow = sheet.getLastRow();
  let existingIds = [];
  if (lastRow > 1) {
    existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  }

  // 4. 比對並寫入新資料
  let newCount = 0;
  const timestamp = new Date().toLocaleString();

  clips.reverse().forEach(clip => { // reverse 是為了讓舊的先寫入，保持時間序
    if (!existingIds.includes(clip.id)) {
      sheet.appendRow([
        clip.id,                  // A: ID
        clip.broadcaster_name,    // B: Broadcaster
        clip.title,               // C: Title
        clip.view_count,          // D: View Count
        clip.created_at,          // E: Created At
        clip.url,                 // F: URL
        false,                    // G: Is Sent (預設為 false)
        timestamp,                // H: Updated At
        clip.thumbnail_url,       // I: Thumbnail (新增) ★
        clip.creator_name         // J: Creator (新增) ★
      ]);
      newCount++;
    }
  });

  console.log(`✅ 同步完成：新增了 ${newCount} 筆剪輯資料到資料庫。`);
}

function getDbSheet(name) {
  const ss = SpreadsheetApp.openById(DB_CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(name);
}
