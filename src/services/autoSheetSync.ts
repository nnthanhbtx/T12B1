import { PlayerRecord, getStoredRecords } from '../components/LeaderboardModal';
import { 
  getStoredAppsScriptUrl, 
  saveStoredAppsScriptUrl, 
  appendRecordViaAppsScript 
} from './appsScript';
import { 
  getStoredSheetMeta, 
  appendRecordToGoogleSheet 
} from './googleSheets';
import { getAccessToken } from './googleAuth';
import { DEFAULT_APPS_SCRIPT_WEBAPP_URL } from '../config/sheetConfig';

export const AUTO_SYNC_ENABLED_KEY = 'trieu_phu_auto_sync_sheet';
const PENDING_QUEUE_KEY = 'trieu_phu_pending_sheet_queue';

export type AutoSyncState = 'idle' | 'syncing' | 'synced' | 'queued' | 'unconfigured' | 'error';

export interface AutoSyncResult {
  success: boolean;
  state: AutoSyncState;
  method?: 'appsScript' | 'oauth';
  message: string;
}

/**
 * Kiểm tra xem chế độ tự động đồng bộ có đang bật hay không (Mặc định: BẬT)
 */
export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
    // Nếu chưa từng thiết lập, mặc định luôn là TRUE
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setAutoSyncEnabled(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Cannot save auto sync preference', e);
  }
}

/**
 * Lấy URL Google Apps Script hiệu lực:
 * 1. Tham số ?script= trên URL (nếu học sinh mở qua link giáo viên gửi)
 * 2. Lưu trữ trong localStorage của trình duyệt
 * 3. Cấu hình mặc định trong code (DEFAULT_APPS_SCRIPT_WEBAPP_URL)
 */
export function getEffectiveAppsScriptUrl(): string {
  try {
    // 1. Kiểm tra URL query param
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('script') || params.get('sheet_url') || params.get('appsscript');
      if (urlParam && urlParam.trim().startsWith('http')) {
        const clean = decodeURIComponent(urlParam.trim());
        saveStoredAppsScriptUrl(clean);
        return clean;
      }
    }
  } catch (e) {
    console.warn('Error reading URL params', e);
  }

  // 2. Kiểm tra localStorage
  const stored = getStoredAppsScriptUrl();
  if (stored && stored.trim()) {
    return stored.trim();
  }

  // 3. Kiểm tra biến cấu hình mặc định
  const defaultUrl = String(DEFAULT_APPS_SCRIPT_WEBAPP_URL || '').trim();
  if (defaultUrl) {
    return defaultUrl;
  }

  return '';
}

/**
 * Hàng đợi ngoại tuyến: lưu tạm khi thiết bị mất mạng
 */
function getPendingQueue(): PlayerRecord[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToPendingQueue(record: PlayerRecord) {
  try {
    const queue = getPendingQueue();
    // Tránh trùng lặp
    if (!queue.some(r => r.id === record.id)) {
      queue.push(record);
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('Cannot queue pending record', e);
  }
}

function clearPendingQueue() {
  try {
    localStorage.removeItem(PENDING_QUEUE_KEY);
  } catch (e) {
    console.warn('Cannot clear pending queue', e);
  }
}

/**
 * Tự động gửi kết quả thi của người chơi về Google Sheet
 * Không cần chủ phòng hay giáo viên phải ngồi trực hay bấm nút đồng bộ thủ công.
 */
export async function autoSendResultToGoogleSheet(
  record: PlayerRecord
): Promise<AutoSyncResult> {
  // 1. Kiểm tra tùy chọn bật/tắt
  if (!isAutoSyncEnabled()) {
    return {
      success: false,
      state: 'idle',
      message: 'Tính năng tự động gửi kết quả đang tạm tắt.'
    };
  }

  // 2. Lấy URL Apps Script (ưu tiên cao nhất vì hỗ trợ mọi người chơi không cần đăng nhập Google)
  const appsScriptUrl = getEffectiveAppsScriptUrl();

  // 3. Kiểm tra nếu đang mất mạng (offline)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    addToPendingQueue(record);
    return {
      success: true,
      state: 'queued',
      message: 'Đã lưu kết quả. Sẽ tự động chuyển lên Google Sheet ngay khi có mạng Internet.'
    };
  }

  // 4. Nếu có URL Apps Script Web App
  if (appsScriptUrl) {
    try {
      await appendRecordViaAppsScript(appsScriptUrl, record);
      // Khi gửi thành công, đồng thời thử đẩy các bản ghi tồn đọng (nếu có)
      flushPendingRecordsAsync();
      return {
        success: true,
        state: 'synced',
        method: 'appsScript',
        message: 'Đã tự động gửi kết quả về Google Sheet của giáo viên!'
      };
    } catch (err: any) {
      console.error('Lỗi khi gửi kết quả qua Apps Script:', err);
      // Lưu vào hàng đợi để gửi lại sau
      addToPendingQueue(record);
      return {
        success: false,
        state: 'error',
        message: 'Không thể kết nối Google Sheet. Bản ghi đã được lưu vào bộ nhớ đệm để gửi lại.'
      };
    }
  }

  // 5. Nếu không có Apps Script URL, kiểm tra OAuth Google Sheet (nếu chủ tài khoản đang đăng nhập)
  const meta = getStoredSheetMeta();
  if (meta?.id) {
    try {
      const token = await getAccessToken();
      if (token) {
        const allRecords = getStoredRecords();
        const indexNumber = allRecords.length;
        await appendRecordToGoogleSheet(meta.id, record, indexNumber);
        return {
          success: true,
          state: 'synced',
          method: 'oauth',
          message: 'Đã lưu kết quả vào Google Sheet qua tài khoản Google!'
        };
      }
    } catch (oauthErr) {
      console.warn('Không thể gửi qua OAuth token:', oauthErr);
    }
  }

  // 6. Chưa cấu hình Google Sheet nào
  return {
    success: false,
    state: 'unconfigured',
    message: 'Chưa cấu hình Google Sheet để nhận kết quả tự động.'
  };
}

/**
 * Đẩy toàn bộ các bản ghi trong hàng đợi ngoại tuyến lên Google Sheet
 */
export async function flushPendingRecords(): Promise<number> {
  const queue = getPendingQueue();
  if (queue.length === 0) return 0;

  const appsScriptUrl = getEffectiveAppsScriptUrl();
  if (!appsScriptUrl) return 0;

  let sentCount = 0;
  const remaining: PlayerRecord[] = [];

  for (const item of queue) {
    try {
      await appendRecordViaAppsScript(appsScriptUrl, item);
      sentCount++;
    } catch {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearPendingQueue();
  }

  return sentCount;
}

function flushPendingRecordsAsync() {
  setTimeout(() => {
    flushPendingRecords().catch(e => console.warn('Flush error', e));
  }, 1000);
}

// Tự động lắng nghe sự kiện khi thiết bị có mạng trở lại
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushPendingRecordsAsync();
  });
}

/**
 * Tạo link chia sẻ cho học sinh có tích hợp sẵn URL Web App của giáo viên
 */
export function generateStudentShareLink(appsScriptUrl?: string): string {
  const url = appsScriptUrl || getEffectiveAppsScriptUrl();
  if (!url) {
    return typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  }
  const base = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname 
    : '';
  return `${base}?script=${encodeURIComponent(url)}`;
}
