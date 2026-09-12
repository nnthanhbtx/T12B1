import { getAccessToken } from './googleAuth';
import { PlayerRecord } from '../components/LeaderboardModal';

export const SET_NAMES = [
  'Bộ 1 (Căn bản - Đơn điệu)',
  'Bộ 2 (Đồ thị & BBT)',
  'Bộ 3 (Hàm phân thức & Tham số)',
  'Bộ 4 (Cực trị & Vận dụng)',
  'Bộ 5 (Tổng hợp chuẩn 15 câu)'
];

const LAST_SHEET_KEY = 'trieu_phu_last_sheet_meta';

export interface LinkedSheetMeta {
  id: string;
  url: string;
  title: string;
  updatedAt: string;
}

export function getStoredSheetMeta(): LinkedSheetMeta | null {
  try {
    const raw = localStorage.getItem(LAST_SHEET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSheetMeta(meta: LinkedSheetMeta | null) {
  if (meta) {
    localStorage.setItem(LAST_SHEET_KEY, JSON.stringify(meta));
  } else {
    localStorage.removeItem(LAST_SHEET_KEY);
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Handle full URL like https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

function formatRows(records: PlayerRecord[]) {
  const headers = [
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

  const rows = records.map((r, index) => [
    index + 1,
    r.name,
    r.playerClass,
    SET_NAMES[r.setIndex] || `Bộ đề ${r.setIndex + 1}`,
    r.score,
    r.prize,
    r.timeFormatted,
    r.date,
    r.isVictory
      ? 'Chiến thắng (Triệu phú Toán 12)'
      : r.score >= 10
      ? 'Vượt mốc 2 (Câu 10)'
      : r.score >= 5
      ? 'Vượt mốc 1 (Câu 5)'
      : 'Dừng cuộc chơi'
  ]);

  return [headers, ...rows];
}

/**
 * Creates a brand-new Google Spreadsheet in user's Drive with formatting and records
 */
export async function createGoogleSheet(
  title: string,
  records: PlayerRecord[]
): Promise<LinkedSheetMeta> {
  const token = await getAccessToken();
  if (!token) throw new Error('Vui lòng đăng nhập tài khoản Google để tiếp tục.');

  const safeTitle = title.trim() || `Ai Là Triệu Phú Toán 12 - Bảng Vàng (${new Date().toLocaleDateString('vi-VN')})`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: safeTitle
      },
      sheets: [
        {
          properties: {
            title: 'Bảng Vàng Triệu Phú',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể tạo file Google Sheet mới.');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Populate rows
  await updateGoogleSheet(spreadsheetId, records, 'Bảng Vàng Triệu Phú');

  const meta: LinkedSheetMeta = {
    id: spreadsheetId,
    url: sheetUrl,
    title: safeTitle,
    updatedAt: new Date().toLocaleString('vi-VN')
  };
  saveStoredSheetMeta(meta);
  return meta;
}

/**
 * Overwrites / Updates records on a specified Google Sheet
 */
export async function updateGoogleSheet(
  spreadsheetId: string,
  records: PlayerRecord[],
  sheetTabName: string = 'Bảng Vàng Triệu Phú'
): Promise<LinkedSheetMeta> {
  const token = await getAccessToken();
  if (!token) throw new Error('Vui lòng đăng nhập tài khoản Google.');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const values = formatRows(records);

  // Clear existing content in tab first (or write over from A1)
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodeURIComponent(sheetTabName)}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `'${sheetTabName}'!A1`,
        majorDimension: 'ROWS',
        values
      })
    }
  );

  // If the sheet tab didn't exist, try writing to Sheet1
  if (!writeRes.ok) {
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: 'A1',
          majorDimension: 'ROWS',
          values
        })
      }
    );

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể cập nhật dữ liệu vào Google Sheet.');
    }
  }

  // Format header row (Dark blue background with yellow/white bold text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 9
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.18, blue: 0.36 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 0.85, blue: 0.2 },
                    bold: true,
                    fontSize: 11
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 9
              }
            }
          }
        ]
      })
    });
  } catch (fmtErr) {
    console.warn('Optional header formatting warning:', fmtErr);
  }

  const meta: LinkedSheetMeta = {
    id: cleanId,
    url: `https://docs.google.com/spreadsheets/d/${cleanId}`,
    title: 'Google Sheet Bảng Vàng',
    updatedAt: new Date().toLocaleString('vi-VN')
  };
  saveStoredSheetMeta(meta);
  return meta;
}

/**
 * Appends a single newly finished game result into an existing sheet
 */
export async function appendRecordToGoogleSheet(
  spreadsheetId: string,
  record: PlayerRecord,
  indexNumber: number,
  sheetTabName: string = 'Bảng Vàng Triệu Phú'
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Vui lòng đăng nhập tài khoản Google.');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const rowData = [
    indexNumber,
    record.name,
    record.playerClass,
    SET_NAMES[record.setIndex] || `Bộ đề ${record.setIndex + 1}`,
    record.score,
    record.prize,
    record.timeFormatted,
    record.date,
    record.isVictory
      ? 'Chiến thắng (Triệu phú Toán 12)'
      : record.score >= 10
      ? 'Vượt mốc 2 (Câu 10)'
      : record.score >= 5
      ? 'Vượt mốc 1 (Câu 5)'
      : 'Dừng cuộc chơi'
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodeURIComponent(sheetTabName)}'!A:I:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    }
  );

  if (!res.ok) {
    // Fallback without tab name
    const fbRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A:I:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowData]
        })
      }
    );
    if (!fbRes.ok) {
      const err = await fbRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể ghi thêm dòng vào Google Sheet.');
    }
  }
}
