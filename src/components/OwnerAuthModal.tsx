import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Crown, 
  LogOut, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Globe, 
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_OWNER_EMAIL } from '../services/ownerAuth';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  ownerEmail: string | null;
  authMethod: 'google' | 'pin' | null;
  onLoginPin: (pin: string, remember: boolean) => boolean;
  onLoginGoogle: () => Promise<{ success: boolean; error?: string }>;
  onLockOrLogout: () => void;
  onOpenGoogleSheets?: () => void;
  onUpdatePin: (newPin: string) => boolean;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  isOwner,
  ownerEmail,
  authMethod,
  onLoginPin,
  onLoginGoogle,
  onLockOrLogout,
  onOpenGoogleSheets,
  onUpdatePin
}) => {
  const [pinInput, setPinInput] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Change PIN mode
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!pinInput.trim()) {
      setPinError('Vui lòng nhập mã PIN chủ tài khoản.');
      return;
    }

    const success = onLoginPin(pinInput.trim(), rememberDevice);
    if (success) {
      setPinInput('');
      onClose();
    } else {
      setPinError('Mã PIN không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  const handleGoogleSubmit = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    const result = await onLoginGoogle();
    setIsGoogleLoading(false);
    if (result.success) {
      onClose();
    } else {
      setGoogleError(result.error || 'Đăng nhập Google không thành công.');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length < 4) {
      setPinError('Mã PIN mới phải có ít nhất 4 ký tự.');
      return;
    }
    const ok = onUpdatePin(newPinInput.trim());
    if (ok) {
      setPinSuccessMsg('Đổi mã PIN thành công!');
      setIsChangingPin(false);
      setNewPinInput('');
      setTimeout(() => setPinSuccessMsg(null), 3000);
    } else {
      setPinError('Không thể lưu mã PIN mới.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border-2 border-yellow-500/60 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.25)] w-full max-w-md p-6 text-white relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <XCircle size={24} />
        </button>

        {isOwner ? (
          /* ======================================================== */
          /* ALREADY LOGGED IN AS OWNER                               */
          /* ======================================================== */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300">
                <Crown size={26} className="text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-300">Quyền Chủ Tài Khoản</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={13} /> Đang hoạt động ({authMethod === 'google' ? 'Google' : 'Mã PIN'})
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-yellow-500/30 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Chủ sở hữu:</span>
                <span className="font-bold text-yellow-300">{ownerEmail || DEFAULT_OWNER_EMAIL}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Trạng thái bảo vệ:</span>
                <span className="font-semibold text-emerald-300">Đã mở khóa quản trị</span>
              </div>
            </div>

            {pinSuccessMsg && (
              <div className="mb-3 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{pinSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {onOpenGoogleSheets && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGoogleSheets();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <FileSpreadsheet size={16} /> Mở Cấu hình Google Sheets
                </button>
              )}

              {isChangingPin ? (
                <form onSubmit={handleChangePinSubmit} className="p-3 bg-slate-950/70 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Nhập mã PIN mới (tối thiểu 4 số):</div>
                  <input
                    type="password"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Nhập mã PIN mới..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-yellow-500 text-slate-950 font-bold text-xs hover:bg-yellow-400"
                    >
                      Lưu mã PIN
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings size={14} /> Đổi mã PIN bảo vệ
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onLockOrLogout();
                  onClose();
                }}
                className="w-full bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={15} /> Khóa về Chế độ Học sinh (Đăng xuất Chủ)
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* NOT OWNER - VERIFICATION FORM                             */
          /* ======================================================== */
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300 shrink-0">
                <ShieldCheck size={24} className="text-slate-950" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-yellow-300">
                  Xác Thực Chủ Tài Khoản
                </h3>
                <p className="text-[11px] text-slate-400">
                  Dành riêng cho Giáo viên / Quản trị viên
                </p>
              </div>
            </div>

            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 mb-4 text-[11px] text-blue-200 leading-relaxed">
              🔒 <span className="font-semibold text-white">Bảo mật dữ liệu:</span> Người chơi chỉ xem các mục cần thiết (làm bài, xem bảng vàng, tải kết quả). Chỉ chủ tài khoản mới có quyền cấu hình Google Sheets và quản lý xóa lịch sử thi.
            </div>

            {pinError && (
              <div className="mb-3 p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {googleError && (
              <div className="mb-3 p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{googleError}</span>
              </div>
            )}

            {/* Method 1: PIN Unlock */}
            <form onSubmit={handlePinSubmit} className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound size={13} className="text-yellow-400" />
                  <span>Nhập mã PIN chủ phòng:</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Nhập mã PIN bảo mật..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-yellow-500 focus:ring-0"
                  />
                  <span>Ghi nhớ trên thiết bị này</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock size={14} /> Mở Quyền Chủ Tài Khoản
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase">Hoặc</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Method 2: Google Sign In with Owner Account */}
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={isGoogleLoading}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-750 border border-slate-600 hover:border-slate-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Globe size={15} className="text-blue-400" />
              <span>
                {isGoogleLoading ? 'Đang kết nối...' : `Đăng nhập Google (${DEFAULT_OWNER_EMAIL})`}
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
