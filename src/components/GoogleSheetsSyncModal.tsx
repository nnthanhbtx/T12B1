import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  FileSpreadsheet, 
  ExternalLink, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User, 
  Sparkles, 
  Database, 
  ArrowRight,
  Code2,
  Copy,
  Check,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle 
} from '../services/googleAuth';
import { 
  createGoogleSheet, 
  updateGoogleSheet, 
  getStoredSheetMeta, 
  LinkedSheetMeta 
} from '../services/googleSheets';
import {
  APPS_SCRIPT_CODE,
  getStoredAppsScriptUrl,
  saveStoredAppsScriptUrl,
  sendToAppsScript,
  syncAllViaAppsScript
} from '../services/appsScript';
import {
  isAutoSyncEnabled,
  setAutoSyncEnabled as persistAutoSync,
  getEffectiveAppsScriptUrl,
  generateStudentShareLink
} from '../services/autoSheetSync';
import { PlayerRecord } from './LeaderboardModal';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PlayerRecord[];
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  // Method selection: 'appsScript' (recommended) | 'googleAuth'
  const [connectMethod, setConnectMethod] = useState<'appsScript' | 'googleAuth'>('appsScript');

  // Apps Script State
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAppsScriptTesting, setIsAppsScriptTesting] = useState(false);

  // Google OAuth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheet configuration state (OAuth)
  const [linkedMeta, setLinkedMeta] = useState<LinkedSheetMeta | null>(null);
  const [mode, setMode] = useState<'create' | 'existing'>('create');
  const [newSheetTitle, setNewSheetTitle] = useState(
    `Ai Là Triệu Phú Toán 12 - Bảng Vàng (${new Date().toLocaleDateString('vi-VN')})`
  );
  const [existingSheetInput, setExistingSheetInput] = useState('');
  
  // Sync status
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Destructive Confirmation Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmDescription, setConfirmDescription] = useState('');

  // Auto-sync preference (Mặc định luôn bật)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => isAutoSyncEnabled());
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);

  const toggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    persistAutoSync(enabled);
  };

  const handleCopyStudentLink = async () => {
    const link = generateStudentShareLink(appsScriptUrl);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedStudentLink(true);
      setTimeout(() => setCopiedStudentLink(false), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedStudentLink(true);
      setTimeout(() => setCopiedStudentLink(false), 3000);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setSyncStatus(null);
    setAuthError(null);
    setCopiedCode(false);
    setCopiedStudentLink(false);

    // Load stored Apps Script URL
    const storedScriptUrl = getEffectiveAppsScriptUrl();
    setAppsScriptUrl(storedScriptUrl);

    // Load stored Google Sheet meta
    const stored = getStoredSheetMeta();
    setLinkedMeta(stored);
    if (stored) {
      setExistingSheetInput(stored.url);
    }

    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        setIsAuthChecking(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthChecking(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const handleCopyAppsScriptCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = APPS_SCRIPT_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleSaveAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    saveStoredAppsScriptUrl(url);
  };

  const handleTestAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Vui lòng dán URL Web App Google Apps Script trước khi kiểm tra.'
      });
      return;
    }

    setIsAppsScriptTesting(true);
    setSyncStatus(null);
    try {
      const res = await sendToAppsScript(appsScriptUrl, { action: 'ping' });
      setSyncStatus({
        type: 'success',
        message: 'Kết nối thành công tới Google Apps Script Web App! Bảng tính đã sẵn sàng ghi điểm.'
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Không thể kết nối tới Google Apps Script. Hãy đảm bảo bạn đã chọn quyền "Bất kỳ ai" (Anyone) khi Triển khai Web App.'
      });
    } finally {
      setIsAppsScriptTesting(false);
    }
  };

  const executeSyncViaAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Vui lòng nhập URL Web App của Google Apps Script.'
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus(null);
    try {
      await syncAllViaAppsScript(appsScriptUrl, records);
      setSyncStatus({
        type: 'success',
        message: `Đã đồng bộ toàn bộ ${records.length} thí sinh vào Google Sheet qua Apps Script!`
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Lỗi khi gửi dữ liệu sang Google Apps Script.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const { user } = await googleSignIn();
      setCurrentUser(user);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setSyncStatus(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const executeCreateNew = async () => {
    setIsLoading(true);
    setSyncStatus(null);
    try {
      const meta = await createGoogleSheet(newSheetTitle, records);
      setLinkedMeta(meta);
      setSyncStatus({
        type: 'success',
        message: `Đã tạo thành công Google Sheet mới và đồng bộ ${records.length} người chơi!`
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Có lỗi xảy ra khi tạo Google Sheet.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeUpdateExisting = async () => {
    if (!existingSheetInput.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Vui lòng nhập Link hoặc ID của Google Sheet cần cập nhật.'
      });
      return;
    }
    setIsLoading(true);
    setSyncStatus(null);
    try {
      const meta = await updateGoogleSheet(existingSheetInput, records);
      setLinkedMeta(meta);
      setSyncStatus({
        type: 'success',
        message: `Đã cập nhật thành công ${records.length} người chơi vào Google Sheet!`
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Không thể cập nhật Google Sheet. Vui lòng kiểm tra quyền truy cập của tài khoản.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mandatory user confirmation dialog before updating or creating/overwriting
  const requestConfirmation = (actionType: 'create' | 'update' | 'appsscript_sync') => {
    if (actionType === 'create') {
      setConfirmDescription(
        `Bạn có chắc chắn muốn tạo bảng tính Google Sheet mới có tên "${newSheetTitle}" và xuất toàn bộ ${records.length} bản ghi người chơi vào Drive của bạn không?`
      );
      setPendingAction(() => executeCreateNew);
      setShowConfirmDialog(true);
    } else if (actionType === 'update') {
      setConfirmDescription(
        `Thao tác này sẽ ghi đè toàn bộ ${records.length} bản ghi người chơi vào trang tính Google Sheet đã chọn. Bạn có chắc chắn muốn cập nhật không?`
      );
      setPendingAction(() => executeUpdateExisting);
      setShowConfirmDialog(true);
    } else {
      setConfirmDescription(
        `Thao tác này sẽ đồng bộ toàn bộ ${records.length} bản ghi người chơi vào trang tính Google Sheet được liên kết với Web App này. Bạn có chắc chắn muốn tiếp tục?`
      );
      setPendingAction(() => executeSyncViaAppsScript);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] w-full max-w-2xl flex flex-col relative text-white overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300">
              <FileSpreadsheet size={24} className="text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-400 uppercase tracking-wide">
                Đồng Bộ Google Sheets
              </h2>
              <p className="text-xs text-emerald-300/90">
                Lưu và cập nhật bảng điểm tự động lên Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-blue-900/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setConnectMethod('appsScript'); setSyncStatus(null); }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                connectMethod === 'appsScript'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={15} className="text-yellow-300" />
              <span>Google Apps Script (Khuyên dùng)</span>
            </button>
            <button
              type="button"
              onClick={() => { setConnectMethod('googleAuth'); setSyncStatus(null); }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                connectMethod === 'googleAuth'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={15} />
              <span>Đăng nhập Google OAuth</span>
            </button>
          </div>

          {/* METHOD 1: APPS SCRIPT WEB APP */}
          {connectMethod === 'appsScript' ? (
            <div className="space-y-4">
              {/* Feature highlight banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
                <Sparkles size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Tại sao nên dùng Google Apps Script?</strong>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Học sinh <strong>không cần đăng nhập tài khoản Google</strong> khi chơi game. Điểm số sẽ tự động gửi thẳng về Google Sheet của giáo viên ngay sau mỗi lượt chơi!
                  </p>
                </div>
              </div>

              {/* Step 1: Copy Code */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">1</span>
                    <span>Mã code.js cho Google Apps Script</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAppsScriptCode}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                      copiedCode
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950'
                    }`}
                  >
                    {copiedCode ? (
                      <>
                        <Check size={14} />
                        <span>Đã chép mã!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Sao chép mã Code.js</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions steps */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed font-mono">
                  <p className="text-yellow-300 font-sans font-bold">Các bước thao tác trong Google Sheets:</p>
                  <p>1. Mở file Google Sheets của bạn &rarr; chọn <strong>Tiện ích mở rộng (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</p>
                  <p>2. Xóa hết code cũ trong file <strong>Code.gs</strong>, dán mã vừa sao chép vào rồi bấm <strong>Lưu (Ctrl + S)</strong>.</p>
                  <p>3. Bấm <strong>Triển khai (Deploy)</strong> &rarr; <strong>Tùy chọn triển khai mới (New deployment)</strong>.</p>
                  <p>4. Chọn loại <strong>Ứng dụng web (Web app)</strong> &rarr; Mục <em>Người có quyền truy cập</em> chọn <strong>Bất kỳ ai (Anyone)</strong> &rarr; Bấm <strong>Triển khai</strong>.</p>
                  <p>5. Sao chép <strong>URL ứng dụng web</strong> (đuôi kết thúc bằng <code className="text-emerald-400">/exec</code>) và dán vào ô bên dưới.</p>
                </div>
              </div>

              {/* Step 2: Paste Web App URL */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">2</span>
                  <span>Dán URL Web App của bạn</span>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={appsScriptUrl}
                    onChange={(e) => handleSaveAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    URL này sẽ được tự động lưu trên trình duyệt của bạn cho những lần thi đấu tiếp theo.
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestAppsScript}
                    disabled={isAppsScriptTesting || !appsScriptUrl.trim()}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAppsScriptTesting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Kiểm tra kết nối</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => requestConfirmation('appsscript_sync')}
                    disabled={isLoading || !appsScriptUrl.trim()}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs uppercase tracking-wide transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} className="text-yellow-300" />
                    )}
                    <span>Đồng bộ toàn bộ ({records.length} người)</span>
                  </button>
                </div>

                {/* Student Share Link Card */}
                {appsScriptUrl.trim() && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Globe size={14} />
                        <span>Link thi đấu gửi học sinh (Tự động nộp điểm)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyStudentLink}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedStudentLink ? (
                          <>
                            <Check size={12} />
                            <span>Đã chép link!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Sao chép link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Gửi link này cho học sinh: Khi các em kết thúc lượt chơi trên điện thoại hay máy tính, kết quả sẽ <strong>tự động gửi về Google Sheet</strong> này mà không cần chủ tài khoản cập nhật thủ công.
                    </p>
                  </div>
                )}
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Tự động đẩy điểm vào Sheet khi kết thúc lượt chơi</div>
                  <div className="text-[11px] text-slate-400">
                    Mỗi học sinh hoàn thành trò chơi, hệ thống sẽ tự động thêm 1 dòng mới vào Google Sheet qua Web App.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => toggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          ) : (
            /* METHOD 2: GOOGLE OAUTH */
            <div className="space-y-4">
              {!currentUser ? (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-blue-500/30 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <User size={26} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Kết nối tài khoản Google</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      Để cập nhật bảng điểm vào Google Sheets của bạn, vui lòng đăng nhập bằng tài khoản Google.
                    </p>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2 justify-center">
                      <AlertCircle size={15} className="shrink-0 text-red-400" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Official Google Sign In Material Button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="relative inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-slate-800 font-semibold text-sm shadow-md hover:bg-slate-100 active:scale-95 transition-all border border-slate-300 cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>{isSigningIn ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Account info bar */}
                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt={currentUser.displayName || ''} 
                          className="w-10 h-10 rounded-full border border-emerald-400/50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                          {currentUser.displayName?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{currentUser.displayName || 'Tài khoản Google'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                            Đã kết nối
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{currentUser.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      title="Đăng xuất"
                      className="text-xs text-slate-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span className="hidden sm:inline">Đăng xuất</span>
                    </button>
                  </div>

                  {/* Currently Linked Sheet (if any) */}
                  {linkedMeta && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                          <Database size={13} />
                          <span>Google Sheet hiện tại</span>
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5">
                          {linkedMeta.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Cập nhật lần cuối: {linkedMeta.updatedAt}
                        </div>
                      </div>

                      <a
                        href={linkedMeta.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shrink-0 cursor-pointer"
                      >
                        <span>Mở Sheet</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}

                  {/* Mode Selection Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/60 border border-blue-900/40 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setMode('create')}
                      className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === 'create'
                          ? 'bg-emerald-600 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <PlusCircle size={14} />
                      <span>Tạo bảng tính mới</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('existing')}
                      className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === 'existing'
                          ? 'bg-emerald-600 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <RefreshCw size={14} />
                      <span>Cập nhật Sheet có sẵn</span>
                    </button>
                  </div>

                  {/* Mode Options */}
                  {mode === 'create' ? (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-blue-500/20">
                      <label className="block text-xs font-semibold text-slate-300">
                        Tên file Google Sheet mới:
                      </label>
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="Nhập tên file Google Sheet..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <p className="text-[11px] text-slate-400">
                        Hệ thống sẽ tạo file mới trên Google Drive của bạn, tự động định dạng tiêu đề màu xanh - chữ vàng chuyên nghiệp và ghi toàn bộ <strong>{records.length} người chơi</strong>.
                      </p>

                      <button
                        type="button"
                        onClick={() => requestConfirmation('create')}
                        disabled={isLoading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm uppercase tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Đang tạo & xuất dữ liệu...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="text-yellow-300" />
                            <span>Tạo và Xuất dữ liệu lên Google Sheets</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-blue-500/20">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nhập Link hoặc ID của Google Sheet:
                      </label>
                      <input
                        type="text"
                        value={existingSheetInput}
                        onChange={(e) => setExistingSheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs... hoặc ID"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono text-xs"
                      />
                      <p className="text-[11px] text-amber-300/90">
                        Lưu ý: Dữ liệu sẽ được ghi vào trang tính <strong>"Bảng Vàng Triệu Phú"</strong> (hoặc trang tính đầu tiên) của file này.
                      </p>

                      <button
                        type="button"
                        onClick={() => requestConfirmation('update')}
                        disabled={isLoading || !existingSheetInput.trim()}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-sm uppercase tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Đang cập nhật Google Sheet...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} />
                            <span>Cập nhật ({records.length} người chơi) vào Sheet này</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Auto Sync Toggle */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Tự động đồng bộ sau mỗi lượt thi đấu</div>
                      <div className="text-[11px] text-slate-400">
                        Mỗi khi học sinh hoàn thành trò chơi, kết quả sẽ tự động lưu vào Google Sheet hiện tại.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => toggleAutoSync(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Status Banner */}
          {syncStatus && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/60 text-red-200'
              }`}
            >
              {syncStatus.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{syncStatus.message}</p>
                {syncStatus.type === 'success' && linkedMeta && (
                  <a
                    href={linkedMeta.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-yellow-300 hover:text-yellow-200 font-bold underline mt-1.5"
                  >
                    <span>Mở file Google Sheets vừa cập nhật</span>
                    <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-emerald-900/30 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* User Confirmation Dialog (MANDATORY per Workspace Skill destructive/mutation rules) */}
        <AnimatePresence>
          {showConfirmDialog && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border-2 border-emerald-400 rounded-2xl p-5 w-full max-w-md shadow-2xl text-left space-y-4"
              >
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
                  <FileSpreadsheet size={22} />
                  <span>Xác nhận cập nhật Google Sheets</span>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {confirmDescription}
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Xác nhận cập nhật
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

