const CLIP_USER = '<username>';
const CLIP_DC_WEBHOOK = '<discord_webhook>';

const PUSH_LIMIT = 5;

function routineMainClips() {
  console.log('🎬 [排程啟動] 開始執行剪輯精華自動化流程...');
  
  try {
    // 第一步：先去 Twitch 抓新資料存入資料庫
    console.log('--- 步驟 1/2: 同步資料庫 ---');
    syncClipsToSheet(CLIP_USER);
    
    // 稍微休息一下，確保 Sheet 寫入完成 (GAS 有時會有微小延遲)
    Utilities.sleep(2000); 

    // 第二步：檢查資料庫並推播到 Discord
    console.log('--- 步驟 2/2: 執行推播 ---');
    pushUnsentClipsToDiscord(CLIP_USER);
    
  } catch (e) {
    console.error('❌ 自動化流程發生意外錯誤:', e);
  }
  
  console.log('🏁 [排程結束] 流程執行完畢。');
}


function pushUnsentClipsToDiscord(name) {
  const sheet = getDbSheet(name);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    console.log('📭 資料庫是空的。');
    return;
  }

  // 1. 讀取所有資料
  // 範圍: 第 2 列到最後一列，共 8 欄 (A~H)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
  const data = dataRange.getValues();
  
  let sentCount = 0;

  // 2. 遍歷資料庫尋找未發送的
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const isSent = row[6]; // G欄 (陣列索引 6)
    const viewCount = row[3]; // D欄
    
    // 條件過濾：
    // 1. 必須是未發送 (false)
    // 2. (選用) 觀看數必須大於 10 才推播 (你可以自己改數字，避免推播太冷門的)
    if (isSent === false && viewCount >= 0) { 
      
      if (sentCount >= PUSH_LIMIT) break; // 達到單次發送上限就停止

      // 準備 Clip 物件給發送函式用
      const clipObj = {
        title: row[2],
        url: row[5],
        broadcaster_name: row[1],
        view_count: row[3],
        created_at: row[4],
        thumbnail_url: row[8],
        creator_name: row[9]
      };

      // 發送!
      try {
        sendClipToDiscordFromSheet(clipObj);
        
        sheet.getRange(i + 2, 7).setValue(true); 
        
        sentCount++;
        console.log(`🚀 已推播: ${clipObj.title}`);
      } catch (e) {
        console.error(`❌ 推播失敗: ${clipObj.title}`, e);
      }
    }
  }

  console.log(`🏁 推播作業結束，共發送 ${sentCount} 則。`);
}

// 專門給 Sheet 用的 Discord 發送器 (簡化版)
function sendClipToDiscordFromSheet(clip) {
  if (!CLIP_DC_WEBHOOK) return;

  const payload = {
    content: `🍿 **${clip.broadcaster_name}** 的精華片段！`,
    embeds: [{
      title: clip.title,
      url: clip.url,
      color: 10181046, // Twitch Purple
      
      // ★ 加入縮圖 (Discord 會自動抓大圖)
      image: { 
        url: clip.thumbnail_url 
      },
      
      // ★ 加入剪輯者資訊
      author: {
        name: `剪輯者: ${clip.creator_name}`,
      },
      
      fields: [
        { name: '日期', value: clip.created_at.split('T')[0], inline: true }
      ],
      
      footer: { text: 'Twitch Clips Notifier' }
    }]
  };

  UrlFetchApp.fetch(CLIP_DC_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
