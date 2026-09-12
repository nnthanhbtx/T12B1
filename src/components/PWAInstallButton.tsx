import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running as an installed PWA on the home screen/desktop, hide
  if (isInstalled) {
    return null;
  }

  // Handle Chrome / Android / Windows / macOS Chromium install
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={install}
          id="pwa-install-compact-btn"
          title="Cài đặt ứng dụng về máy để chơi offline không cần mạng"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/80 hover:bg-blue-500 border border-blue-400/50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer ${className}`}
        >
          <Download size={14} className="text-yellow-300" />
          <span>Cài app</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        id="pwa-install-btn"
        className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl border border-blue-400/40 shadow-lg transition-all text-xs md:text-sm flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer min-h-[42px] ${className}`}
      >
        <Download size={16} className="text-yellow-300" />
        <span>Cài đặt về máy (Chơi không cần Wifi)</span>
      </button>
    );
  }

  // Handle iOS (iPhone / iPad) Safari instructions
  if (isIOS) {
    return (
      <>
        {variant === 'compact' ? (
          <button
            type="button"
            onClick={() => setShowIOSModal(true)}
            id="pwa-install-ios-compact-btn"
            title="Cài đặt trên iPhone/iPad"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/80 hover:bg-blue-500 border border-blue-400/50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer ${className}`}
          >
            <Smartphone size={14} className="text-yellow-300" />
            <span>Cài vào iPhone/iPad</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSModal(true)}
            id="pwa-install-ios-btn"
            className={`w-full bg-gradient-to-r from-blue-700/80 to-slate-800 hover:from-blue-600 hover:to-slate-700 text-blue-100 font-bold py-2 px-4 rounded-xl border border-blue-500/40 shadow-md transition-all text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[40px] ${className}`}
          >
            <Smartphone size={15} className="text-yellow-400" />
            <span>Thêm vào màn hình chính iPhone / iPad</span>
          </button>
        )}

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-blue-500/50 p-5 shadow-2xl text-left relative text-white">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-yellow-300 font-black text-xl shadow-md">
                  TP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Cài đặt trên iPhone & iPad</h3>
                  <p className="text-[11px] text-blue-300">Chơi mượt mà không cần kết nối mạng Wifi</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 mb-4 bg-slate-800/80 p-3.5 rounded-xl border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600/50 text-blue-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</div>
                  <p>Mở trang web trong trình duyệt <strong>Safari</strong> trên iPhone hoặc iPad.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600/50 text-blue-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</div>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    Nhấn nút <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 font-medium text-[11px]"><Share size={12} /> Chia sẻ</span> ở thanh công cụ dưới đáy màn hình.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600/50 text-blue-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</div>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    Cuộn xuống và chọn <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-yellow-300 font-medium text-[11px]"><PlusSquare size={12} /> Thêm vào MH chính</span>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition text-center"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
