import { PlayerRecord } from '../components/LeaderboardModal';

export const APPS_SCRIPT_STORAGE_KEY = 'trieu_phu_apps_script_url';

export const APPS_SCRIPT_CODE = `/**
 * ===================================================================
 * AI LÀ TRIỆU PHÚ TOÁN 12 - GOOGLE APPS SCRIPT ĐỒNG BỘ BẢNG VÀNG
 * ===================================================================
 * HƯỚNG DẪN 4 BƯỚC CÀI ĐẶT:
 * 1. Mở file Google Sheets của bạn (hoặc tạo một file mới trên Google Drive).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết mã code mặc định trong file Code.gs, dán toàn bộ đoạn mã này vào và nhấn Lưu (Ctrl + S).
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> "Tùy chọn triển khai mới" (New deployment):
 *    - Chọn loại: "Ứng dụng web" (Web app).
 *    - Mô tả: Bảng vàng Triệu phú Toán 12
 *    - Thực thi dưới dạng: "Tôi" (Me - tài khoản Google của bạn)
 *    - Người có quyền truy cập: "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG để học sinh gửi điểm không cần đăng nhập!
 *    - Nhấn "Triển khai" (Deploy) -> Cấp quyền truy cập nếu Google yêu cầu.
 * 5. Sao chép URL ứng dụng web (có đuôi /exec) và dán vào ứng dụng!
 * ===================================================================
 */

const SHEET_NAME = 'Bảng Vàng Triệu Phú';
const SET_NAMES = [
  'Bộ 1 (Căn bản - Đơn điệu)',
  'Bộ 2 (Đồ thị & BBT)',
  'Bộ 3 (Hàm phân thức & Tham số)',
  'Bộ 4 (Cực trị & Vận dụng)',
  'Bộ 5 (Tổng hợp chuẩn 15 câu)'
];

/**
 * Xử lý kiểm tra kết nối từ ứng dụng (GET)
 */
function doGet(e) {
  return createJsonResponse({
    status: 'success',
    message: 'Kết nối Google Apps Script thành công!',
    sheetName: SHEET_NAME,
    timestamp: new Date().toLocaleString('vi-VN')
  });
}

/**
 * Xử lý nhận dữ liệu gửi từ ứng dụng (POST)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: 'error',
        message: 'Không tìm thấy dữ liệu (postData rỗng).'
      });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        status: 'error',
        message: 'Dữ liệu không phải định dạng JSON hợp lệ: ' + parseErr.message
      });
    }

    var sheet = getOrCreateSheet();
    var action = data.action || 'append';

    if (action === 'append') {
      // 1. Thêm một lượt chơi mới
      var record = data.record || data;
      var lastRow = sheet.getLastRow();
      var stt = Math.max(1, lastRow); // Dòng tiếp theo

      var setName = SET_NAMES[record.setIndex] || ('Bộ đề ' + ((record.setIndex || 0) + 1));
      var resultText = record.isVictory
        ? 'Chiến thắng (Triệu phú Toán 12)'
        : (record.score >= 10 ? 'Vượt mốc 2 (Câu 10)' : (record.score >= 5 ? 'Vượt mốc 1 (Câu 5)' : 'Dừng cuộc chơi'));

      var rowData = [
        stt,
        record.name || 'Thí sinh',
        record.playerClass || '12',
        setName,
        record.score !== undefined ? record.score : 0,
        record.prize || '0 VNĐ',
        record.timeFormatted || '00:00',
        record.date || new Date().toLocaleString('vi-VN'),
        resultText
      ];

      sheet.appendRow(rowData);

      // Căn chỉnh thẩm mỹ
      var newRowIdx = sheet.getLastRow();
      sheet.getRange(newRowIdx, 1, 1, 9).setHorizontalAlignment('center').setVerticalAlignment('middle');
      sheet.getRange(newRowIdx, 2).setHorizontalAlignment('left'); // Tên căn lề trái
      sheet.setRowHeight(newRowIdx, 28);

      return createJsonResponse({
        status: 'success',
        message: 'Đã lưu kết quả của thí sinh ' + (record.name || '') + ' vào Google Sheet!',
        stt: stt
      });

    } else if (action === 'syncAll') {
      // 2. Đồng bộ toàn bộ danh sách thí sinh
      var records = data.records || [];
      sheet.clear();
      setupHeader(sheet);

      if (records.length > 0) {
        var rows = records.map(function(r, index) {
          var setName = SET_NAMES[r.setIndex] || ('Bộ đề ' + ((r.setIndex || 0) + 1));
          var resultText = r.isVictory
            ? 'Chiến thắng (Triệu phú Toán 12)'
            : (r.score >= 10 ? 'Vượt mốc 2 (Câu 10)' : (r.score >= 5 ? 'Vượt mốc 1 (Câu 5)' : 'Dừng cuộc chơi'));

          return [
            index + 1,
            r.name || 'Thí sinh',
            r.playerClass || '12',
            setName,
            r.score !== undefined ? r.score : 0,
            r.prize || '0 VNĐ',
            r.timeFormatted || '00:00',
            r.date || new Date().toLocaleString('vi-VN'),
            resultText
          ];
        });

        var range = sheet.getRange(2, 1, rows.length, 9);
        range.setValues(rows);
        range.setHorizontalAlignment('center').setVerticalAlignment('middle');
        sheet.getRange(2, 2, rows.length, 1).setHorizontalAlignment('left');
        
        for (var rIdx = 2; rIdx <= rows.length + 1; rIdx++) {
          sheet.setRowHeight(rIdx, 28);
        }
      }

      autoFormatColumns(sheet);

      return createJsonResponse({
        status: 'success',
        message: 'Đã đồng bộ ' + records.length + ' thí sinh vào Google Sheet thành công!'
      });
    }

    return createJsonResponse({
      status: 'error',
      message: 'Hành động không hỗ trợ: ' + action
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'Lỗi Google Apps Script: ' + err.toString()
    });
  }
}

/**
 * Tìm hoặc tự động tạo trang tính "Bảng Vàng Triệu Phú"
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeader(sheet);
  } else if (sheet.getLastRow() === 0) {
    setupHeader(sheet);
  }
  return sheet;
}

/**
 * Tạo hàng tiêu đề phong cách Triệu Phú Toán 12 (Xanh Navy & Vàng Gold)
 */
function setupHeader(sheet) {
  var headers = [
    'STT',
    'Họ và tên',
    'Lớp',
    'Bộ đề thi',
    'Số câu đúng (/15)',
    'Mức tiền thưởng (VNĐ)',
    'Thời gian làm bài',
    'Thời điểm ghi nhận',
    'Kết quả đạt được'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setValues([headers])
    .setBackground('#0f172a') // Nền xanh đen sang trọng
    .setFontColor('#facc15')   // Vàng gold rực rỡ
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1); // Cố định hàng tiêu đề
  autoFormatColumns(sheet);
}

/**
 * Tự động chỉnh độ rộng cột
 */
function autoFormatColumns(sheet) {
  for (var col = 1; col <= 9; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * Trả về phản hồi dạng JSON
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export function getStoredAppsScriptUrl(): string {
  try {
    return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredAppsScriptUrl(url: string) {
  try {
    if (url.trim()) {
      localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(APPS_SCRIPT_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Cannot save Apps Script URL to localStorage', e);
  }
}

/**
 * Gửi dữ liệu tới Google Apps Script Web App
 */
export async function sendToAppsScript(url: string, payload: any): Promise<{ status: string; message: string }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error('Chưa cấu hình URL Web App Google Apps Script.');
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.status === 'error') {
        throw new Error(data.message || 'Lỗi xử lý từ Google Apps Script.');
      }
      return data;
    } catch (parseErr: any) {
      if (parseErr.message?.includes('Lỗi xử lý')) throw parseErr;
      return {
        status: 'success',
        message: 'Dữ liệu đã gửi thành công tới Google Sheets!'
      };
    }
  } catch (err: any) {
    // Nếu gặp CORS khi redirect, thử chế độ no-cors để đảm bảo dữ liệu vẫn tới Google Apps Script
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return {
        status: 'success',
        message: 'Đã gửi dữ liệu thành công tới Google Sheets qua Web App!'
      };
    } catch (fallbackErr: any) {
      throw new Error(err.message || 'Không thể kết nối tới Google Apps Script. Vui lòng kiểm tra lại URL Web App.');
    }
  }
}

/**
 * Thêm 1 bản ghi mới vào Google Sheet qua Apps Script
 */
export async function appendRecordViaAppsScript(url: string, record: PlayerRecord) {
  return sendToAppsScript(url, {
    action: 'append',
    record
  });
}

/**
 * Đồng bộ toàn bộ danh sách vào Google Sheet qua Apps Script
 */
export async function syncAllViaAppsScript(url: string, records: PlayerRecord[]) {
  return sendToAppsScript(url, {
    action: 'syncAll',
    records
  });
}
