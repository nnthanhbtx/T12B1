import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  Search, 
  Trash2, 
  RotateCcw, 
  XCircle, 
  Award, 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check,
  ShieldCheck,
  Crown,
  Lock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { autoSendResultToGoogleSheet } from '../services/autoSheetSync';

export interface PlayerRecord {
  id: string;
  name: string;
  playerClass: string;
  score: number; // 0-15
  prize: string;
  timeSpent: number; // in seconds
  timeFormatted: string;
  setIndex: number; // 0 to 4
  date: string;
  isVictory: boolean;
}

export const INITIAL_LEADERBOARD: PlayerRecord[] = [
  {
    id: 'rec-1',
    name: 'Nguyễn Hoàng Nam',
    playerClass: '12A1',
    score: 15,
    prize: '85.000.000 VNĐ',
    timeSpent: 215,
    timeFormatted: '03:35',
    setIndex: 0,
    date: '18/08/2026 08:30',
    isVictory: true
  },
  {
    id: 'rec-2',
    name: 'Trần Mai Anh',
    playerClass: '12A2',
    score: 15,
    prize: '85.000.000 VNĐ',
    timeSpent: 248,
    timeFormatted: '04:08',
    setIndex: 1,
    date: '18/08/2026 09:15',
    isVictory: true
  },
  {
    id: 'rec-3',
    name: 'Lê Quốc Bảo',
    playerClass: '12A1',
    score: 14,
    prize: '60.000.000 VNĐ',
    timeSpent: 195,
    timeFormatted: '03:15',
    setIndex: 2,
    date: '17/08/2026 15:40',
    isVictory: false
  },
  {
    id: 'rec-4',
    name: 'Phạm Thu Trang',
    playerClass: '12A3',
    score: 13,
    prize: '40.000.000 VNĐ',
    timeSpent: 210,
    timeFormatted: '03:30',
    setIndex: 3,
    date: '17/08/2026 16:20',
    isVictory: false
  },
  {
    id: 'rec-5',
    name: 'Võ Minh Đạt',
    playerClass: '12A2',
    score: 12,
    prize: '30.000.000 VNĐ',
    timeSpent: 180,
    timeFormatted: '03:00',
    setIndex: 4,
    date: '16/08/2026 10:10',
    isVictory: false
  },
  {
    id: 'rec-6',
    name: 'Đặng Thanh Thảo',
    playerClass: '12A4',
    score: 10,
    prize: '14.000.000 VNĐ',
    timeSpent: 165,
    timeFormatted: '02:45',
    setIndex: 0,
    date: '16/08/2026 14:05',
    isVictory: false
  }
];

const STORAGE_KEY = 'ai_la_trieu_phu_toan12_bang_vang_v2';

export function getStoredRecords(): PlayerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADERBOARD));
      return INITIAL_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function clearStoredRecords(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing records', e);
  }
}

export function deleteStoredRecord(id: string): PlayerRecord[] {
  try {
    const current = getStoredRecords();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting record', e);
    return [];
  }
}

export function resetSampleRecords(): PlayerRecord[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADERBOARD));
    return INITIAL_LEADERBOARD;
  } catch (e) {
    return INITIAL_LEADERBOARD;
  }
}

export function savePlayerRecord(record: Omit<PlayerRecord, 'id' | 'date'>) {
  try {
    const current = getStoredRecords();
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newRecord: PlayerRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      date: formattedDate
    };

    const updated = [newRecord, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Tự động gửi kết quả về Google Sheet ngay khi người chơi kết thúc lượt chơi
    try {
      autoSendResultToGoogleSheet(newRecord).catch(err => {
        console.warn('Auto-sync record to Google Sheet failed:', err);
      });
    } catch (syncErr) {
      console.warn('Auto-sync check error:', syncErr);
    }

    return newRecord;
  } catch (e) {
    console.error('Error saving record', e);
  }
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRecordId?: string;
  isOwner?: boolean;
  onOpenOwnerAuth?: () => void;
}

type ConfirmModalState = 
  | { type: 'clearAll' }
  | { type: 'deleteRow'; record: PlayerRecord }
  | { type: 'resetSample' }
  | null;

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highlightRecordId,
  isOwner = false,
  onOpenOwnerAuth
}) => {
  const [records, setRecords] = useState<PlayerRecord[]>(() => getStoredRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSet, setFilterSet] = useState<number | 'all'>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score');
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reload records whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRecords(getStoredRecords());
      setConfirmModal(null);
    }
  }, [isOpen]);

  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.playerClass) set.add(r.playerClass.toUpperCase());
    });
    return Array.from(set).sort();
  }, [records]);

  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter(r => {
        const matchesQuery = 
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.playerClass.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSet = filterSet === 'all' || r.setIndex === filterSet;
        const matchesClass = filterClass === 'all' || r.playerClass.toUpperCase() === filterClass;
        return matchesQuery && matchesSet && matchesClass;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          if (b.score !== a.score) return b.score - a.score;
          return a.timeSpent - b.timeSpent; // Faster time wins on tie
        } else {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [records, searchQuery, filterSet, filterClass, sortBy]);

  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const handleExportCSV = () => {
    const setNames = [
      'Bộ 1 (Căn bản)',
      'Bộ 2 (Đồ thị)',
      'Bộ 3 (Phân thức)',
      'Bộ 4 (Cực trị)',
      'Bộ 5 (Tổng hợp)'
    ];

    const headers = ['STT', 'Họ và tên', 'Lớp', 'Bộ đề', 'Số câu đúng (/15)', 'Mức thưởng (VNĐ)', 'Thời gian làm bài', 'Ngày chơi', 'Kết quả'];
    const rows = filteredAndSortedRecords.map((r, idx) => [
      idx + 1,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.playerClass || '').replace(/"/g, '""')}"`,
      `"${setNames[r.setIndex] || `Bộ ${r.setIndex + 1}`}"`,
      r.score,
      `"${r.prize}"`,
      r.timeFormatted,
      r.date,
      r.isVictory ? 'Chiến thắng (Triệu phú)' : (r.score >= 10 ? 'Mốc 2' : (r.score >= 5 ? 'Mốc 1' : 'Dừng cuộc chơi'))
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lich_su_Trieu_Phu_Toan_12_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file CSV thành công!');
  };

  const handleCopyToClipboard = async () => {
    const setNames = [
      'Bộ 1 (Căn bản)',
      'Bộ 2 (Đồ thị)',
      'Bộ 3 (Phân thức)',
      'Bộ 4 (Cực trị)',
      'Bộ 5 (Tổng hợp)'
    ];

    const headers = ['STT', 'Họ và tên', 'Lớp', 'Bộ đề', 'Số câu đúng', 'Mức thưởng', 'Thời gian', 'Ngày chơi', 'Kết quả'];
    const rows = filteredAndSortedRecords.map((r, idx) => [
      idx + 1,
      r.name,
      r.playerClass,
      setNames[r.setIndex] || `Bộ ${r.setIndex + 1}`,
      `${r.score}/15`,
      r.prize,
      r.timeFormatted,
      r.date,
      r.isVictory ? 'Chiến thắng' : (r.score >= 10 ? 'Vượt Mốc 2' : (r.score >= 5 ? 'Vượt Mốc 1' : 'Dừng cuộc chơi'))
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopiedFeedback(true);
      showToast('Đã sao chép bảng dữ liệu! Mở Google Sheets và bấm Ctrl + V.');
      setTimeout(() => setCopiedFeedback(false), 3000);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;

    if (confirmModal.type === 'clearAll') {
      clearStoredRecords();
      setRecords([]);
      showToast('Đã xóa toàn bộ lịch sử Bảng Vàng.');
    } else if (confirmModal.type === 'deleteRow') {
      const updated = deleteStoredRecord(confirmModal.record.id);
      setRecords(updated);
      showToast(`Đã xóa kết quả của thí sinh ${confirmModal.record.name}.`);
    } else if (confirmModal.type === 'resetSample') {
      const samples = resetSampleRecords();
      setRecords(samples);
      showToast('Đã khôi phục dữ liệu mẫu ban đầu.');
    }

    setConfirmModal(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto safe-top safe-bottom safe-x">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border-2 border-yellow-500/60 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.25)] w-full max-w-4xl max-h-[90dvh] flex flex-col relative text-white overflow-hidden my-auto"
      >
        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-emerald-500/80 px-4 py-2 rounded-xl text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md pointer-events-none"
            >
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 flex justify-between items-center relative">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300 shrink-0">
              <Trophy size={22} className="text-slate-950 sm:hidden" />
              <Trophy size={26} className="text-slate-950 hidden sm:block" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 uppercase tracking-wide">
                  Bảng Vàng Triệu Phú Toán 12
                </h2>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold">
                    <Crown size={12} className="text-yellow-400" />
                    Chủ tài khoản
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Chế độ học sinh
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm text-blue-300 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Chủ đề: Tính đơn điệu và cực trị của hàm số — SGK Toán 12 KNTT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <XCircle size={28} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-blue-900/40 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc lớp..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-blue-500/30 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            {/* Set Filter */}
            <select
              value={filterSet}
              onChange={e => setFilterSet(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-slate-800 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-blue-200 focus:outline-none focus:border-yellow-400"
            >
              <option value="all">Tất cả bộ đề</option>
              <option value="0">Bộ 1 (Căn bản)</option>
              <option value="1">Bộ 2 (Đồ thị)</option>
              <option value="2">Bộ 3 (Phân thức)</option>
              <option value="3">Bộ 4 (Cực trị)</option>
              <option value="4">Bộ 5 (Tổng hợp)</option>
            </select>

            {/* Class Filter */}
            {distinctClasses.length > 0 && (
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-slate-800 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-blue-200 focus:outline-none focus:border-yellow-400"
              >
                <option value="all">Tất cả các lớp</option>
                {distinctClasses.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-800 p-1 border border-blue-500/30 text-xs">
              <button
                onClick={() => setSortBy('score')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  sortBy === 'score'
                    ? 'bg-yellow-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Top Điểm Cao
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  sortBy === 'recent'
                    ? 'bg-yellow-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Gần Đây
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {filteredAndSortedRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award size={48} className="mx-auto mb-3 opacity-30 text-yellow-400" />
              <p className="text-lg font-medium">Chưa có kết quả nào trong Bảng Vàng.</p>
              <p className="text-xs text-slate-500 mt-1">
                {records.length === 0
                  ? 'Lịch sử thi đấu đang trống. Hãy bắt đầu lượt chơi mới!'
                  : 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.'}
              </p>
              {isOwner && records.length === 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmModal({ type: 'resetSample' })}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-bold transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Nạp lại 6 bản ghi mẫu</span>
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedRecords.map((item, index) => {
              const isHighlight = item.id === highlightRecordId;
              const isGold = index === 0;
              const isSilver = index === 1;
              const isBronze = index === 2;

              let rankBadge = (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-sm border border-slate-700">
                  {index + 1}
                </div>
              );

              let cardBorder = 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70';
              if (isGold) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-base shadow-[0_0_15px_rgba(234,179,8,0.6)]">
                    🥇 1
                  </div>
                );
                cardBorder = 'border-yellow-500/60 bg-gradient-to-r from-yellow-950/30 via-slate-900 to-slate-900 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
              } else if (isSilver) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(226,232,240,0.5)]">
                    🥈 2
                  </div>
                );
                cardBorder = 'border-slate-400/50 bg-gradient-to-r from-slate-800/60 via-slate-900 to-slate-900';
              } else if (isBronze) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(180,83,9,0.5)]">
                    🥉 3
                  </div>
                );
                cardBorder = 'border-amber-700/50 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900';
              }

              if (isHighlight) {
                cardBorder += ' ring-2 ring-yellow-400 animate-pulse';
              }

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border ${cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">{rankBadge}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-white tracking-wide">
                          {item.name}
                        </span>
                        <span className="bg-blue-600/30 text-blue-300 border border-blue-400/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Lớp {item.playerClass}
                        </span>
                        {item.isVictory && (
                          <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            👑 Triệu phú Toán
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen size={13} className="text-blue-400" /> Bộ đề {item.setIndex + 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-amber-400" /> {item.timeFormatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" /> {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pl-12 md:pl-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-400 uppercase font-medium">Số câu đúng</div>
                      <div className="text-xl font-extrabold text-yellow-400">
                        {item.score} <span className="text-sm font-normal text-slate-400">/ 15</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase font-medium">Mức thưởng</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {item.prize}
                      </div>
                    </div>

                    {/* Owner-Only: Delete individual record */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ type: 'deleteRow', record: item })}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 transition-all cursor-pointer shrink-0"
                        title={`Xóa kết quả của ${item.name} (${item.playerClass})`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/90 border-t border-blue-900/30 flex flex-wrap items-center justify-between gap-3">
          {/* Owner Controls */}
          {isOwner ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsGoogleSheetsModalOpen(true)}
                id="btn-sync-google-sheets"
                title="Đồng bộ trực tiếp danh sách người chơi vào Google Sheets trên Google Drive (Dành cho Chủ tài khoản)"
                className="text-xs font-bold text-white flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border border-emerald-400/50 transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer"
              >
                <FileSpreadsheet size={15} className="text-yellow-300" />
                <span>Đồng bộ Google Sheets</span>
              </button>

              <button
                onClick={handleCopyToClipboard}
                id="btn-copy-to-sheets"
                title="Sao chép toàn bộ danh sách để dán (Ctrl + V) trực tiếp vào Google Sheets"
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
              >
                {copiedFeedback ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-emerald-400" />
                    <span>Sao chép bảng</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                id="btn-export-csv"
                title="Tải về file CSV để mở bằng Excel hoặc nhập vào Google Sheets"
                className="text-xs font-semibold text-blue-300 hover:text-blue-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
              >
                <Download size={14} className="text-blue-400" />
                <span>Tải Excel / CSV</span>
              </button>

              <button
                onClick={() => setConfirmModal({ type: 'resetSample' })}
                className="text-xs text-slate-400 hover:text-blue-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đặt lại 6 bản ghi mẫu (Chỉ dành cho chủ tài khoản)"
              >
                <RotateCcw size={13} /> Dữ liệu mẫu
              </button>

              <button
                onClick={() => setConfirmModal({ type: 'clearAll' })}
                className="text-xs text-red-400/90 hover:text-red-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 transition-colors cursor-pointer"
                title="Xóa toàn bộ lịch sử (Chỉ dành cho chủ tài khoản)"
              >
                <Trash2 size={13} /> Xóa toàn bộ
              </button>
            </div>
          ) : (
            /* Student / Non-Owner View */
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Chế độ học sinh: Bảng vàng chỉ xem • Dữ liệu được bảo vệ an toàn</span>
              </div>
              {onOpenOwnerAuth && (
                <button
                  type="button"
                  onClick={onOpenOwnerAuth}
                  className="text-xs text-slate-400 hover:text-yellow-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer ml-1"
                  title="Xác thực quyền Chủ tài khoản / Giáo viên để quản trị dữ liệu"
                >
                  <Lock size={12} className="text-yellow-400" />
                  <span>Quyền Chủ Tài Khoản</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg ml-auto cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>

      {/* Robust In-App Confirmation Modal (Never blocked by iframe sandboxes) */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-yellow-500/60 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl relative text-white"
            >
              {confirmModal.type === 'clearAll' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center mx-auto mb-3 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <Trash2 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-red-300 mb-1">
                    Xóa toàn bộ lịch sử Bảng Vàng?
                  </h3>
                  <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                    Bạn có chắc chắn muốn xóa vĩnh viễn <strong>tất cả {records.length} bản ghi</strong> thi đấu trên thiết bị này không?
                    Hành động này không thể hoàn tác.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-lg"
                    >
                      <Trash2 size={13} />
                      <span>Đồng ý xóa hết</span>
                    </button>
                  </div>
                </>
              )}

              {confirmModal.type === 'deleteRow' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/60 flex items-center justify-center mx-auto mb-3 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-base font-bold text-yellow-300 mb-1">
                    Xác nhận xóa bản ghi
                  </h3>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Xóa kết quả của thí sinh: <br />
                    <span className="font-bold text-white text-sm">{confirmModal.record.name}</span>
                    <span className="text-blue-300 ml-1">(Lớp {confirmModal.record.playerClass})</span>
                    <br />
                    <span className="text-yellow-400 font-semibold mt-1 inline-block">
                      Đạt {confirmModal.record.score}/15 câu • {confirmModal.record.prize}
                    </span>
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-lg"
                    >
                      <Trash2 size={13} />
                      <span>Xóa bản ghi này</span>
                    </button>
                  </div>
                </>
              )}

              {confirmModal.type === 'resetSample' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-950/80 border border-blue-500/60 flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <RotateCcw size={24} />
                  </div>
                  <h3 className="text-base font-bold text-blue-300 mb-1">
                    Nạp lại dữ liệu mẫu ban đầu?
                  </h3>
                  <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                    Hành động này sẽ thay thế danh sách hiện tại bằng 6 bản ghi thi đấu mẫu ban đầu để kiểm tra giao diện.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-lg"
                    >
                      <RotateCcw size={13} />
                      <span>Nạp dữ liệu mẫu</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Sheets Sync Modal */}
      {isOwner && (
        <GoogleSheetsSyncModal
          isOpen={isGoogleSheetsModalOpen}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          records={records}
        />
      )}
    </div>
  );
};
