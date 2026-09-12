import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  HelpCircle, 
  Phone, 
  Users, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Lightbulb, 
  Trophy, 
  Star, 
  Medal, 
  Award, 
  Flame, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ShieldCheck,
  Menu,
  ChevronRight,
  Volume2,
  VolumeX,
  Shuffle,
  FileSpreadsheet,
  Crown,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { questionSets, Question, shuffleQuestionOptions } from './data';
import { LeaderboardModal, savePlayerRecord, getStoredRecords } from './components/LeaderboardModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { autoSendResultToGoogleSheet, AutoSyncState } from './services/autoSheetSync';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { useOwnerAuth } from './hooks/useOwnerAuth';
import { MathGraphic } from './components/MathGraphic';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import Latex from 'react-latex-next';

// --- Pure Web Audio API Engine (Works 100% Offline with zero network dependencies) ---
class AudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  
  init() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }
  }

  playTone(frequency: number, type: OscillatorType, duration: number, volume = 0.1) {
    if (!this.enabled) return;
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
    }
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio error catch
    }
  }

  playHover() { this.playTone(600, 'sine', 0.08, 0.04); }
  playSelect() { this.playTone(320, 'square', 1.6, 0.05); }
  playCorrect() {
    this.playTone(440, 'sine', 0.35, 0.1); // A4
    setTimeout(() => this.playTone(554.37, 'sine', 0.35, 0.1), 90); // C#5
    setTimeout(() => this.playTone(659.25, 'sine', 0.7, 0.12), 180); // E5
  }
  playWrong() {
    this.playTone(220, 'sawtooth', 0.4, 0.1);
    setTimeout(() => this.playTone(160, 'sawtooth', 0.7, 0.12), 200);
  }
  playWin() {
    [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.5, 0.1), i * 140);
    });
  }
}

const audio = new AudioEngine();

// Auto unlock Web Audio on first user interaction on iOS Safari & Android
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    audio.init();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('touchend', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('touchend', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio);
}

const PRIZE_LADDER = [
  "100.000 VNĐ",
  "200.000 VNĐ",
  "300.000 VNĐ",
  "500.000 VNĐ",
  "1.000.000 VNĐ", // Mốc an toàn 1 (Câu 5)
  "2.000.000 VNĐ",
  "3.600.000 VNĐ",
  "6.000.000 VNĐ",
  "10.000.000 VNĐ",
  "14.000.000 VNĐ", // Mốc an toàn 2 (Câu 10)
  "22.000.000 VNĐ",
  "30.000.000 VNĐ",
  "40.000.000 VNĐ",
  "60.000.000 VNĐ",
  "85.000.000 VNĐ"  // Triệu phú Toán học (Câu 15)
];

const SET_TITLES = [
  "Bộ 1: Căn bản & Phát triển",
  "Bộ 2: Nâng cao tư duy & Đồ thị",
  "Bộ 3: Tư duy đạo hàm & Phân thức",
  "Bộ 4: Cực trị & Bài toán thực tế",
  "Bộ 5: Tổng hợp & Thực tiễn GDPT 2018"
];

export default function App() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover' | 'victory'>('intro');
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  
  const [selectedSetMode, setSelectedSetMode] = useState<number | 'random'>('random');
  const [questionSetIndex, setQuestionSetIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [showResultStatus, setShowResultStatus] = useState<'none' | 'correct' | 'wrong'>('none');
  
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, askAudience: true, callFriend: true });
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  
  const [activeModal, setActiveModal] = useState<'none' | 'audience' | 'friend' | 'solution'>('none');
  const [audienceData, setAudienceData] = useState<number[]>([]);
  const [friendMessage, setFriendMessage] = useState('');
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isMobileLadderOpen, setIsMobileLadderOpen] = useState(false);
  const [isConfirmStopOpen, setIsConfirmStopOpen] = useState(false);
  const [latestRecordId, setLatestRecordId] = useState<string | undefined>(undefined);
  const [hasRecordedSession, setHasRecordedSession] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [sheetSyncState, setSheetSyncState] = useState<AutoSyncState>('idle');
  const [sheetSyncMessage, setSheetSyncMessage] = useState<string>('');

  // Owner authentication & access control
  const ownerAuth = useOwnerAuth();
  const [isOwnerAuthModalOpen, setIsOwnerAuthModalOpen] = useState(false);

  const handleOpenGoogleSheets = () => {
    if (ownerAuth.isOwner) {
      setIsGoogleSheetsOpen(true);
    } else {
      setIsOwnerAuthModalOpen(true);
    }
  };

  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  const currentQ = currentQuestions[currentQIndex] || questionSets[0][0];

  // Toggle Sound
  const toggleSound = () => {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    audio.enabled = !nextMuted;
    if (!nextMuted) {
      audio.init();
    }
  };

  // Global Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const startGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !playerClass.trim()) return;
    audio.init();
    audio.playWin();

    // Determine question set index
    let setIdx = 0;
    if (selectedSetMode === 'random') {
      setIdx = Math.floor(Math.random() * questionSets.length);
    } else {
      setIdx = selectedSetMode;
    }
    setQuestionSetIndex(setIdx);

    // Shuffle options dynamically for every question in this game session
    // ensuring the options A, B, C, D are randomized every single time
    const rawQuestions = questionSets[setIdx] || questionSets[0];
    const randomizedQuestions = rawQuestions.map(q => shuffleQuestionOptions(q));
    setCurrentQuestions(randomizedQuestions);

    setGameState('playing');
    setTimeElapsed(0);
    setCurrentQIndex(0);
    setHasRecordedSession(false);
    setLatestRecordId(undefined);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setShowResultStatus('none');
    setHiddenOptions([]);
    setActiveModal('none');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPrizeWon = (score: number, isVictory: boolean) => {
    if (isVictory || score >= 15) return PRIZE_LADDER[14];
    if (score === 0) return "0 VNĐ";
    return PRIZE_LADDER[score - 1];
  };

  const handleSelectAnswer = (index: number) => {
    if (isAnswerLocked || hiddenOptions.includes(index)) return;
    audio.init();
    audio.playSelect();
    setSelectedAnswer(index);
    setIsAnswerLocked(true);

    // Wait 1.8 seconds before showing result
    setTimeout(() => {
      if (index === currentQ.correctAnswerIndex) {
        audio.playCorrect();
        setShowResultStatus('correct');
      } else {
        audio.playWrong();
        setShowResultStatus('wrong');
      }
    }, 1800);
  };

  const recordGameOverOrVictory = (finalScore: number, isVic: boolean) => {
    if (!hasRecordedSession && playerName.trim()) {
      const prize = getPrizeWon(finalScore, isVic);
      const saved = savePlayerRecord({
        name: playerName.trim(),
        playerClass: playerClass.trim().toUpperCase(),
        score: finalScore,
        prize,
        timeSpent: timeElapsed,
        timeFormatted: formatTime(timeElapsed),
        setIndex: questionSetIndex,
        isVictory: isVic
      });
      if (saved) {
        setLatestRecordId(saved.id);
        // Tự động đẩy kết quả lên Google Sheets không cần chủ tài khoản cập nhật
        setSheetSyncState('syncing');
        setSheetSyncMessage('Đang tự động gửi kết quả về Google Sheet...');
        autoSendResultToGoogleSheet(saved)
          .then((res) => {
            setSheetSyncState(res.state);
            setSheetSyncMessage(res.message);
          })
          .catch(() => {
            setSheetSyncState('error');
            setSheetSyncMessage('Lỗi gửi kết quả tự động.');
          });
      }
      setHasRecordedSession(true);
    }
  };

  const handleNextAction = () => {
    if (showResultStatus === 'correct') {
      if (currentQIndex === 14) {
        audio.playWin();
        recordGameOverOrVictory(15, true);
        setGameState('victory');
      } else {
        setCurrentQIndex(prev => prev + 1);
        resetQuestionState();
      }
    } else if (showResultStatus === 'wrong') {
      recordGameOverOrVictory(currentQIndex, false);
      setGameState('gameover');
    }
  };

  const handleStopGame = () => {
    setIsConfirmStopOpen(true);
  };

  const confirmStopAndSave = () => {
    setIsConfirmStopOpen(false);
    setIsMobileLadderOpen(false);
    recordGameOverOrVictory(currentQIndex, false);
    setGameState('gameover');
  };

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswerLocked) return;
    audio.init();
    audio.playHover();
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
    
    let wrongOptions = [0, 1, 2, 3].filter(i => i !== currentQ.correctAnswerIndex);
    wrongOptions.sort(() => Math.random() - 0.5);
    setHiddenOptions([wrongOptions[0], wrongOptions[1]]);
  };

  const useAskAudience = () => {
    if (!lifelines.askAudience || isAnswerLocked) return;
    audio.init();
    audio.playHover();
    setLifelines(prev => ({ ...prev, askAudience: false }));
    
    let data = [0, 0, 0, 0];
    let remaining = 100;
    
    const correctShare = Math.floor(Math.random() * 26) + 52; 
    data[currentQ.correctAnswerIndex] = correctShare;
    remaining -= correctShare;
    
    const otherIndices = [0, 1, 2, 3].filter(i => i !== currentQ.correctAnswerIndex && !hiddenOptions.includes(i));
    otherIndices.forEach((idx, i) => {
      if (i === otherIndices.length - 1) {
        data[idx] = remaining;
      } else {
        const share = Math.floor(Math.random() * (remaining * 0.7));
        data[idx] = share;
        remaining -= share;
      }
    });
    
    setAudienceData(data);
    setActiveModal('audience');
  };

  const useCallFriend = () => {
    if (!lifelines.callFriend || isAnswerLocked) return;
    audio.init();
    audio.playHover();
    setLifelines(prev => ({ ...prev, callFriend: false }));
    
    const isCorrect = Math.random() < 0.85;
    const suggestedIndex = isCorrect 
      ? currentQ.correctAnswerIndex 
      : [0,1,2,3].filter(i => i !== currentQ.correctAnswerIndex && !hiddenOptions.includes(i))[0] ?? currentQ.correctAnswerIndex;
    
    const optionsText = ['A', 'B', 'C', 'D'];
    setFriendMessage(`Alo ${playerName} à! Mình vừa học xong phần Đơn điệu & Cực trị này rồi. Mình tự tin 90% đáp án đúng là phương án ${optionsText[suggestedIndex]}. Hãy chọn thật chính xác nhé!`);
    setActiveModal('friend');
  };

  const restartGame = () => {
    setGameState('intro');
    setLifelines({ fiftyFifty: true, askAudience: true, callFriend: true });
    resetQuestionState();
    setSheetSyncState('idle');
    setSheetSyncMessage('');
  };

  const getFeedbackMessage = (score: number) => {
    if (score >= 15) return "Tuyệt đỉnh xuất sắc! Bạn là Nhà Triệu Phú Toán Học 12 đích thực với giải thưởng 85.000.000 VNĐ!";
    if (score >= 11) return "Rất xuất sắc! Bạn nắm cực kì vững kiến thức Vận dụng cao về Đơn điệu và Cực trị hàm số!";
    if (score >= 6) return "Khá tốt! Bạn đã vượt qua các mốc kiến thức Thông hiểu quan trọng. Hãy luyện tập thêm để chinh phục câu 15!";
    return "Cố gắng lên nhé! Hãy đọc kĩ lại bài 1 SGK Toán 12 Kết nối tri thức để chinh phục đỉnh cao!";
  };

  // ==========================================
  // INTRO SCREEN
  // ==========================================
  if (gameState === 'intro') {
    return (
      <div className="min-h-[100dvh] h-[100dvh] bg-[#020024] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden safe-x">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(9,9,121,0.5)_0%,rgba(2,0,36,1)_100%)] z-0"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] min-w-[300px] min-h-[300px] bg-blue-500/20 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] min-w-[300px] min-h-[300px] bg-purple-500/20 rounded-full blur-[90px] pointer-events-none"></div>
        
        {/* Owner status / unlock button on top-left */}
        <button 
          onClick={() => setIsOwnerAuthModalOpen(true)}
          className={`absolute top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full border transition-all shadow-lg cursor-pointer text-xs font-bold ${
            ownerAuth.isOwner
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/30'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-yellow-300 hover:bg-slate-700'
          }`}
          title={ownerAuth.isOwner ? "Chủ tài khoản: Nhấp để quản trị hoặc khóa bảo vệ" : "Chế độ học sinh: Nhấp để mở khóa Giáo viên"}
        >
          {ownerAuth.isOwner ? (
            <>
              <Crown size={15} className="text-yellow-400 shrink-0" />
              <span className="hidden sm:inline">Chủ tài khoản</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-yellow-400/70 shrink-0" />
              <span className="hidden sm:inline">Chủ phòng</span>
            </>
          )}
        </button>

        {/* Sound button on top-right */}
        <button 
          onClick={toggleSound}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-20 p-2 sm:p-2.5 rounded-full bg-slate-800/80 border border-blue-500/40 text-yellow-300 hover:bg-slate-700 transition-colors shadow-lg cursor-pointer"
          title={isSoundMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/95 backdrop-blur-xl p-4 sm:p-8 rounded-3xl shadow-2xl z-10 border-2 border-yellow-500/50 w-full max-w-md text-center relative max-h-[92dvh] overflow-y-auto my-auto"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.6)] mb-3 border-4 border-slate-800">
            <span className="text-3xl md:text-4xl font-black text-slate-950">$</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 mb-1 uppercase tracking-wider">
            Ai Là Triệu Phú
          </h1>
          <h2 className="text-xs md:text-sm font-bold text-blue-200 mb-1 uppercase tracking-widest">
            Bài 1: Tính Đơn Điệu & Cực Trị Của Hàm Số
          </h2>

          <div className="text-[11px] font-semibold text-slate-400 mb-4">
            GV <span className="text-white font-bold">Mr Thanh</span><span className="text-yellow-400 font-bold">btx</span>
          </div>
          
          <form onSubmit={startGame} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                Họ và tên thí sinh:
              </label>
              <input 
                type="text" 
                placeholder="Nhập họ và tên của bạn..." 
                required
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-blue-400/40 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                Lớp học:
              </label>
              <input 
                type="text" 
                placeholder="Ví dụ: 12A1, 12A2, 12D1..." 
                required
                value={playerClass}
                onChange={e => setPlayerClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-blue-400/40 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                Chọn bộ câu hỏi (15 câu phân loại chuẩn):
              </label>
              <select
                value={selectedSetMode}
                onChange={e => setSelectedSetMode(e.target.value === 'random' ? 'random' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-blue-400/40 text-yellow-300 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all text-xs md:text-sm font-semibold cursor-pointer"
              >
                <option value="random">🎲 Chọn ngẫu nhiên bộ đề (Bộ 1 - 5)</option>
                {SET_TITLES.map((title, idx) => (
                  <option key={idx} value={idx}>{title}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 space-y-2.5">
              <button 
                type="submit"
                className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-950 font-extrabold py-3 px-5 rounded-xl shadow-[0_4px_0_0_#a16207] active:shadow-none active:translate-y-1 transition-all text-base md:text-lg flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer min-h-[48px]"
              >
                <Play fill="currentColor" size={18} /> Bắt đầu chơi
              </button>

              {ownerAuth.isOwner ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLeaderboardOpen(true)}
                    className="w-full bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 hover:bg-yellow-500/30 border border-yellow-500/60 text-yellow-300 font-bold py-2.5 px-3 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer min-h-[42px]"
                  >
                    <Trophy size={16} className="text-yellow-400 shrink-0" />
                    <span className="truncate">Bảng Vàng</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGoogleSheets}
                    id="btn-intro-google-sheets"
                    className="w-full bg-gradient-to-r from-emerald-600/30 via-green-500/20 to-emerald-600/30 hover:bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 font-bold py-2.5 px-3 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer min-h-[42px]"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Google Sheets</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="w-full bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 hover:bg-yellow-500/30 border border-yellow-500/60 text-yellow-300 font-bold py-2.5 px-3 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-2 uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer min-h-[42px]"
                >
                  <Trophy size={16} className="text-yellow-400 shrink-0" />
                  <span>Xem Bảng Vàng Xếp Hạng</span>
                </button>
              )}

              {/* In-App PWA Install Prompt for Android/iOS/Desktop */}
              <PWAInstallButton />
            </div>
          </form>
        </motion.div>

        {/* Leaderboard Modal */}
        <LeaderboardModal 
          isOpen={isLeaderboardOpen} 
          onClose={() => setIsLeaderboardOpen(false)} 
          isOwner={ownerAuth.isOwner}
          onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
        />

        {/* Google Sheets Sync Modal (Only if owner) */}
        <GoogleSheetsSyncModal
          isOpen={isGoogleSheetsOpen && ownerAuth.isOwner}
          onClose={() => setIsGoogleSheetsOpen(false)}
          records={getStoredRecords()}
        />

        {/* Owner Authentication Modal */}
        <OwnerAuthModal
          isOpen={isOwnerAuthModalOpen}
          onClose={() => setIsOwnerAuthModalOpen(false)}
          isOwner={ownerAuth.isOwner}
          ownerEmail={ownerAuth.ownerEmail}
          authMethod={ownerAuth.authMethod}
          onLoginPin={ownerAuth.loginWithPin}
          onLoginGoogle={ownerAuth.loginWithGoogleOwner}
          onLockOrLogout={ownerAuth.lockOrLogout}
          onOpenGoogleSheets={handleOpenGoogleSheets}
          onUpdatePin={ownerAuth.updatePin}
        />

        {/* Offline Status Badge */}
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // GAME OVER / VICTORY SCREEN
  // ==========================================
  if (gameState === 'gameover' || gameState === 'victory') {
    const isVictory = gameState === 'victory';
    const finalScore = isVictory ? 15 : currentQIndex;
    const finalPrize = getPrizeWon(finalScore, isVictory);
    
    return (
      <div className="min-h-[100dvh] h-[100dvh] bg-[#020024] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden safe-top safe-bottom safe-x">
        {/* Confetti */}
        {isVictory && (
          <div className="absolute inset-0 pointer-events-none z-0 flex flex-wrap justify-center overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, x: Math.random() * window.innerWidth, rotate: 0 }}
                animate={{ y: window.innerHeight + 50, x: Math.random() * window.innerWidth, rotate: 360 }}
                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                className="w-2.5 h-2.5 absolute"
                style={{ backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)] }}
              />
            ))}
          </div>
        )}
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(9,9,121,0.5)_0%,rgba(2,0,36,1)_100%)] z-0"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/95 backdrop-blur-xl p-4 sm:p-8 rounded-3xl shadow-2xl z-10 border-2 border-yellow-500/50 w-full max-w-lg text-center max-h-[92dvh] overflow-y-auto my-auto"
        >
          <div className="mb-3 flex justify-center">
            {isVictory ? (
              <div className="relative">
                <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.7)] animate-bounce" />
                <Sparkles size={24} className="text-amber-300 absolute -top-2 -right-2 animate-spin" />
              </div>
            ) : (
              <Medal size={60} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
            )}
          </div>
          
          <h1 className="text-xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 mb-1 uppercase tracking-wide">
            {isVictory ? 'BẠN LÀ TRIỆU PHÚ TOÁN 12!' : 'KẾT THÚC CUỘC CHƠI!'}
          </h1>
          
          <div className="text-sm md:text-base text-blue-100 mb-1 font-medium">
            Thí sinh: <span className="text-yellow-400 font-bold">{playerName}</span> — Lớp: <span className="text-yellow-400 font-bold">{playerClass}</span>
          </div>
          <div className="text-xs text-slate-400 mb-4 font-semibold">
            {SET_TITLES[questionSetIndex]}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-blue-500/20">
              <div className="text-[10px] text-blue-300 mb-0.5 uppercase font-medium">Số câu đúng</div>
              <div className="text-lg md:text-2xl font-black text-yellow-400">{finalScore} / 15</div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-blue-500/20">
              <div className="text-[10px] text-blue-300 mb-0.5 uppercase font-medium">Mức thưởng</div>
              <div className="text-sm md:text-lg font-black text-emerald-400 truncate">{finalPrize}</div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-blue-500/20">
              <div className="text-[10px] text-blue-300 mb-0.5 uppercase font-medium">Thời gian</div>
              <div className="text-lg md:text-2xl font-black text-white">{formatTime(timeElapsed)}</div>
            </div>
          </div>
          
          <div className="bg-blue-950/60 p-3.5 rounded-xl border border-blue-500/30 mb-4">
            <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
              {getFeedbackMessage(finalScore)}
            </p>
          </div>

          {/* Automatic Google Sheet Sync Status */}
          {sheetSyncState !== 'idle' && (
            <div className="mb-4">
              {sheetSyncState === 'syncing' && (
                <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-400/50 text-xs text-blue-200 flex items-center justify-center gap-2 shadow-inner">
                  <RefreshCw size={14} className="animate-spin text-blue-400 shrink-0" />
                  <span>{sheetSyncMessage || 'Đang tự động gửi kết quả về Google Sheet...'}</span>
                </div>
              )}
              {sheetSyncState === 'synced' && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-center gap-2 shadow-inner">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold">{sheetSyncMessage || 'Đã tự động gửi kết quả về Google Sheet thành công!'}</span>
                </div>
              )}
              {sheetSyncState === 'queued' && (
                <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-xs text-amber-200 flex items-center justify-center gap-2 shadow-inner">
                  <WifiOff size={15} className="text-amber-400 shrink-0" />
                  <span>{sheetSyncMessage}</span>
                </div>
              )}
              {sheetSyncState === 'error' && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center justify-center gap-2 shadow-inner">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span>{sheetSyncMessage}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl shadow-[0_3px_0_0_#92400e] active:translate-y-0.5 transition-all text-xs md:text-sm inline-flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer min-h-[42px]"
            >
              <Trophy size={16} /> Bảng Vàng
            </button>

            {ownerAuth.isOwner && (
              <button 
                onClick={handleOpenGoogleSheets}
                id="btn-gameover-google-sheets"
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-[0_3px_0_0_#065f46] active:translate-y-0.5 transition-all text-xs md:text-sm inline-flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer min-h-[42px]"
              >
                <FileSpreadsheet size={16} className="text-yellow-300" /> Google Sheets
              </button>
            )}

            <button 
              onClick={restartGame}
              className="w-full sm:w-auto bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-[0_3px_0_0_#1e3a8a] active:translate-y-0.5 transition-all text-xs md:text-sm inline-flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer min-h-[42px]"
            >
              <RotateCcw size={16} /> Chơi Lại
            </button>
          </div>
        </motion.div>

        {/* Leaderboard Modal */}
        <LeaderboardModal 
          isOpen={isLeaderboardOpen} 
          onClose={() => setIsLeaderboardOpen(false)}
          highlightRecordId={latestRecordId}
          isOwner={ownerAuth.isOwner}
          onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
        />

        {/* Google Sheets Sync Modal (Only if owner) */}
        <GoogleSheetsSyncModal
          isOpen={isGoogleSheetsOpen && ownerAuth.isOwner}
          onClose={() => setIsGoogleSheetsOpen(false)}
          records={getStoredRecords()}
        />

        {/* Owner Authentication Modal */}
        <OwnerAuthModal
          isOpen={isOwnerAuthModalOpen}
          onClose={() => setIsOwnerAuthModalOpen(false)}
          isOwner={ownerAuth.isOwner}
          ownerEmail={ownerAuth.ownerEmail}
          authMethod={ownerAuth.authMethod}
          onLoginPin={ownerAuth.loginWithPin}
          onLoginGoogle={ownerAuth.loginWithGoogleOwner}
          onLockOrLogout={ownerAuth.lockOrLogout}
          onOpenGoogleSheets={handleOpenGoogleSheets}
          onUpdatePin={ownerAuth.updatePin}
        />

        {/* Offline Status Badge */}
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // PLAYING SCREEN (Mobile & Desktop Optimized)
  // ==========================================
  return (
    <div className="h-[100dvh] bg-[#020024] text-white font-sans overflow-hidden flex flex-col relative select-none">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(9,9,121,0.5)_0%,rgba(2,0,36,1)_100%)] z-0"></div>

      {/* Header Area */}
      <header className="relative z-10 w-full px-3 md:px-6 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-blue-500/30 shrink-0">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
          <div className="w-8 h-8 md:w-11 md:h-11 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_12px_rgba(251,191,36,0.5)] shrink-0">
            <span className="text-sm md:text-lg font-black italic text-slate-950">TP</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xs md:text-base font-bold bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent uppercase tracking-wide truncate">
              AI LÀ TRIỆU PHÚ TOÁN 12
            </h1>
            <p className="text-[10px] md:text-xs text-blue-200 truncate">
              {playerName} ({playerClass})
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            className="p-1.5 md:p-2 rounded-full bg-slate-800/80 border border-blue-500/40 text-yellow-300 hover:bg-slate-700 transition-colors cursor-pointer"
            title={isSoundMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Mobile Ladder Button */}
          <button
            onClick={() => setIsMobileLadderOpen(true)}
            className="flex lg:hidden items-center gap-1 px-2 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold active:scale-95 transition-transform"
          >
            <Trophy size={13} />
            <span>Thang thưởng</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Trophy size={14} className="text-yellow-400" /> Bảng Vàng
          </button>

          {/* Owner-Only: Google Sheets Sync Quick Button */}
          {ownerAuth.isOwner && (
            <button
              onClick={handleOpenGoogleSheets}
              title="Đồng bộ với Google Sheets (Chỉ dành cho Chủ tài khoản)"
              className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span>Sheets</span>
            </button>
          )}

          {/* Timer */}
          <div className="text-center bg-slate-900/80 px-2.5 py-1 rounded-lg border border-blue-500/30">
            <p className="text-xs md:text-sm font-mono font-bold text-yellow-400">{formatTime(timeElapsed)}</p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 relative z-10 flex flex-col lg:flex-row w-full overflow-hidden">
        
        {/* Left Side: Question and Answers */}
        <div className="flex-1 flex flex-col justify-between items-center px-3 md:px-8 py-2 md:py-5 h-full overflow-y-auto">
          
          {/* Progress Info, Level Badge, and Lifelines Control Bar */}
          <div className="w-full max-w-3xl flex items-center justify-between gap-2 mb-2 px-0.5 shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center space-x-1.5 bg-blue-600/30 px-2.5 py-1 rounded-full border border-blue-400/40 text-[11px] md:text-xs">
                <span className="text-yellow-400 font-bold uppercase tracking-wider">
                  CÂU {String(currentQIndex + 1).padStart(2, '0')} / 15
                </span>
                <span className="text-blue-300/60 hidden sm:inline">•</span>
                <span className="text-emerald-400 font-bold hidden sm:inline">{PRIZE_LADDER[currentQIndex]}</span>
              </div>

              {currentQ.level && (
                <span className={`text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  currentQ.level === 'Nhận biết'
                    ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                    : currentQ.level === 'Thông hiểu'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : currentQ.level === 'Vận dụng'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                    : 'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}>
                  {currentQ.level}
                </span>
              )}
            </div>

            {/* 3 Lifelines: 38-40px touch targets, comfortable for mobile thumbs */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <button 
                title="Trợ giúp 50:50"
                disabled={!lifelines.fiftyFifty || isAnswerLocked}
                onClick={useFiftyFifty}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold text-[10px] md:text-xs transition-all shadow ${lifelines.fiftyFifty ? 'border-yellow-400 bg-blue-900/90 text-yellow-400 hover:bg-blue-800 cursor-pointer active:scale-95' : 'border-gray-600 bg-gray-800 text-gray-500 opacity-40 relative'}`}
              >
                {!lifelines.fiftyFifty && <div className="absolute w-full h-[2px] bg-red-600 rotate-45"></div>}
                50:50
              </button>
              <button 
                title="Hỏi ý kiến khán giả"
                disabled={!lifelines.askAudience || isAnswerLocked}
                onClick={useAskAudience}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all shadow ${lifelines.askAudience ? 'border-yellow-400 bg-blue-900/90 text-yellow-400 hover:bg-blue-800 cursor-pointer active:scale-95' : 'border-gray-600 bg-gray-800 text-gray-500 opacity-40 relative'}`}
              >
                {!lifelines.askAudience && <div className="absolute w-full h-[2px] bg-red-600 rotate-45"></div>}
                <Users size={14} />
              </button>
              <button 
                title="Gọi điện người thân"
                disabled={!lifelines.callFriend || isAnswerLocked}
                onClick={useCallFriend}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all shadow ${lifelines.callFriend ? 'border-yellow-400 bg-blue-900/90 text-yellow-400 hover:bg-blue-800 cursor-pointer active:scale-95' : 'border-gray-600 bg-gray-800 text-gray-500 opacity-40 relative'}`}
              >
                {!lifelines.callFriend && <div className="absolute w-full h-[2px] bg-red-600 rotate-45"></div>}
                <Phone size={14} />
              </button>
            </div>
          </div>

          {/* Question Box */}
          <motion.div 
            key={`q-${questionSetIndex}-${currentQIndex}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative w-full max-w-3xl my-auto"
          >
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-2 border-blue-400 py-4 md:py-6 px-4 md:px-8 text-center rounded-2xl md:rounded-3xl shadow-[0_0_30px_rgba(30,58,138,0.6)] max-h-[35vh] md:max-h-[45vh] overflow-y-auto">
              <h2 className="text-sm md:text-xl font-medium leading-relaxed drop-shadow-md">
                <Latex>{currentQ.question}</Latex>
              </h2>
              {/* Graphic Diagram / Tikz rendering */}
              <MathGraphic tikz={currentQ.tikz} diagram={currentQ.diagram} />
            </div>
          </motion.div>

          {/* Answer Grid (1 column on mobile, 2 columns on tablet/desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4 w-full max-w-3xl mt-auto pt-2 pb-1">
            {currentQ.options.map((opt, idx) => {
              const optionLabels = ['A', 'B', 'C', 'D'];
              const isHidden = hiddenOptions.includes(idx);
              const isSelected = selectedAnswer === idx;
              const isCorrectAnswer = currentQ.correctAnswerIndex === idx;
              
              let btnClass = "w-full py-2.5 md:py-3.5 px-4 md:px-6 rounded-2xl text-left transition-all text-xs md:text-base relative z-20 flex items-center min-h-[46px] md:min-h-[52px] cursor-pointer active:scale-[0.98] ";
              
              if (isHidden) {
                btnClass += "opacity-0 pointer-events-none";
              } else if (!isAnswerLocked) {
                btnClass += "bg-gradient-to-r from-blue-950 to-blue-900 border border-blue-400 hover:bg-yellow-500 hover:border-white group-hover:text-black";
              } else if (isSelected && showResultStatus === 'none') {
                // Locked
                btnClass += "bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-white text-black font-semibold shadow-[0_0_15px_rgba(234,179,8,0.5)]";
              } else if (showResultStatus !== 'none') {
                if (isCorrectAnswer) {
                  btnClass += "bg-gradient-to-r from-green-500 to-green-600 border-2 border-white text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse";
                } else if (isSelected && showResultStatus === 'wrong') {
                  btnClass += "bg-gradient-to-r from-red-500 to-red-600 border-2 border-white text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-shake";
                } else {
                  btnClass += "bg-blue-950/40 border border-blue-900/30 text-white/30";
                }
              }

              return (
                <button
                  key={`opt-${idx}`}
                  disabled={isAnswerLocked || isHidden}
                  onClick={() => handleSelectAnswer(idx)}
                  onMouseEnter={() => !isAnswerLocked && audio.playHover()}
                  className={btnClass}
                >
                  <span className={`font-black mr-2 md:mr-3 text-sm md:text-base shrink-0 ${(!isAnswerLocked || (isSelected && showResultStatus === 'none')) && !isHidden ? 'text-yellow-400' : ''}`}>
                    {optionLabels[idx]}:
                  </span>
                  <span className="font-medium flex-1 text-left leading-snug">
                    <Latex>{opt}</Latex>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
          
        {/* Right Side: Score Ladder (Desktop) */}
        <div className="hidden lg:flex flex-1 bg-black/50 border-l border-blue-900/60 p-4 flex-col justify-between overflow-y-auto min-w-[260px] max-w-xs">
          <div className="space-y-1 flex flex-col-reverse h-full justify-end">
            {[...Array(15)].map((_, i) => {
              const isCurrent = i === currentQIndex;
              const isPassed = i < currentQIndex;
              const isSafeHaven = (i + 1) % 5 === 0;
              
              let itemClass = "flex items-center justify-between px-3 py-1 rounded-lg text-xs transition-all ";
              let spanNumClass = "w-5 font-bold ";
              let spanLineClass = "flex-1 border-b mx-2 ";
              let spanPrizeClass = "font-semibold ";
              
              if (isCurrent) {
                itemClass += "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-[1.02]";
                spanLineClass += "border-slate-950/40";
              } else if (isPassed) {
                itemClass += "text-yellow-400/90";
                spanLineClass += "border-yellow-400/20";
              } else if (isSafeHaven) {
                itemClass += "bg-white/15 text-white font-bold";
                spanLineClass += "border-white/20";
                spanPrizeClass += "text-yellow-300";
              } else {
                itemClass += "text-slate-500";
                spanNumClass += "text-slate-500";
                spanLineClass += "border-slate-800";
                spanPrizeClass += "italic";
              }

              return (
                <div key={i} className={itemClass}>
                  <span className={spanNumClass}>{i + 1}</span>
                  <span className={spanLineClass}></span>
                  <span className={spanPrizeClass}>{PRIZE_LADDER[i]}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800">
            <button 
              onClick={handleStopGame}
              className="w-full py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-xl text-xs text-red-200 font-bold transition-colors cursor-pointer"
            >
              DỪNG CUỘC CHƠI BẢO TOÀN THƯỞNG
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Only shown when result is ready) */}
      <AnimatePresence>
        {showResultStatus !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 px-3 md:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between items-center bg-black/90 border-t border-blue-900/60 shrink-0"
          >
            <div className="flex-1 flex items-center justify-between w-full max-w-3xl mx-auto">
              <div
                onClick={() => setActiveModal('solution')}
                className="flex items-center space-x-1.5 group cursor-pointer inline-flex bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-400/40 hover:bg-blue-800/60 active:scale-95 transition-all"
              >
                <Lightbulb size={16} className="text-yellow-300 group-hover:text-white shrink-0" />
                <span className="text-xs font-bold text-blue-300 group-hover:text-white transition-colors">
                  Xem lời giải chi tiết
                </span>
              </div>

              <button
                onClick={handleNextAction}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black rounded-xl shadow-lg uppercase tracking-wider text-xs md:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95"
              >
                {showResultStatus === 'correct' ? (currentQIndex === 14 ? '👑 Nhận giải Triệu Phú' : 'Câu tiếp ➔') : 'Kết thúc'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Ladder Modal */}
      <AnimatePresence>
        {isMobileLadderOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-top safe-bottom safe-x"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              className="bg-slate-900 border-2 border-yellow-500/60 rounded-3xl p-5 w-full max-w-sm relative text-white max-h-[85dvh] overflow-y-auto my-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                  <Trophy size={18} /> Thang tiền thưởng (15 Câu)
                </h3>
                <button 
                  onClick={() => setIsMobileLadderOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="space-y-1 flex flex-col-reverse">
                {[...Array(15)].map((_, i) => {
                  const isCurrent = i === currentQIndex;
                  const isPassed = i < currentQIndex;
                  const isSafeHaven = (i + 1) % 5 === 0;
                  
                  let itemClass = "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ";
                  if (isCurrent) {
                    itemClass += "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow";
                  } else if (isPassed) {
                    itemClass += "text-yellow-400/90";
                  } else if (isSafeHaven) {
                    itemClass += "bg-white/15 text-white font-bold";
                  } else {
                    itemClass += "text-slate-500";
                  }

                  return (
                    <div key={i} className={itemClass}>
                      <span className="w-6 font-bold">{i + 1}</span>
                      <span className="font-semibold">{PRIZE_LADDER[i]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileLadderOpen(false);
                    setIsConfirmStopOpen(true);
                  }}
                  className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-xl text-xs text-red-200 font-bold transition-colors cursor-pointer"
                >
                  DỪNG CUỘC CHƠI BẢO TOÀN THƯỞNG
                </button>

                <button
                  onClick={() => setIsMobileLadderOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
                >
                  Tiếp tục câu hỏi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Confirmation Modal for Stopping the Game */}
      <AnimatePresence>
        {isConfirmStopOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-top safe-bottom safe-x"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-yellow-500/60 rounded-3xl p-5 md:p-6 w-full max-w-sm text-center shadow-2xl relative text-white my-auto"
            >
              <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-yellow-500/60 flex items-center justify-center mx-auto mb-3 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Trophy size={24} />
              </div>
              <h3 className="text-base font-bold text-yellow-300 mb-1">
                Dừng cuộc chơi tại đây?
              </h3>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                Bạn đang ở câu số <strong>{currentQIndex + 1}</strong>. Nếu quyết định dừng cuộc chơi, bạn sẽ bảo toàn mức thưởng đã đạt được:
              </p>
              <div className="text-lg font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 py-2.5 px-3 rounded-xl mb-4 shadow-inner">
                {getPrizeWon(currentQIndex, false)}
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setIsConfirmStopOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition flex-1"
                >
                  Suy nghĩ lại
                </button>
                <button
                  type="button"
                  onClick={confirmStopAndSave}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold cursor-pointer transition shadow-lg flex-1"
                >
                  Xác nhận dừng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lifeline & Solution Modals */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 safe-top safe-bottom safe-x"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-blue-400 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-lg relative text-white max-h-[85dvh] overflow-y-auto my-auto"
            >
              <button 
                onClick={() => setActiveModal('none')}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>

              {activeModal === 'audience' && (
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <Users size={20} /> Ý kiến khán giả trường quay
                  </h3>
                  <div className="flex h-40 md:h-48 items-end justify-center gap-4 md:gap-6 border-b border-slate-700 pb-2">
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} className="flex flex-col items-center w-10 md:w-12 group">
                        <div className="text-xs font-bold text-white mb-1.5">{audienceData[idx]}%</div>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-1000 group-hover:from-yellow-600 group-hover:to-yellow-400"
                          style={{ height: `${audienceData[idx]}%` }}
                        ></div>
                        <div className="mt-2 font-bold text-yellow-400 text-xs md:text-sm">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'friend' && (
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Phone size={20} /> Trợ giúp từ người thân
                  </h3>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-blue-100 relative leading-relaxed text-xs md:text-sm">
                    <div className="absolute -left-2 top-4 w-3.5 h-3.5 bg-slate-800/80 border-l border-t border-slate-700 rotate-[-45deg]"></div>
                    "{friendMessage}"
                  </div>
                </div>
              )}

              {activeModal === 'solution' && (
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Lightbulb size={20} /> Hướng dẫn giải chi tiết
                  </h3>
                  <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-blue-100 leading-relaxed text-sm md:text-base">
                    <Latex>{currentQ.solution}</Latex>
                    <MathGraphic tikz={currentQ.tikz} diagram={currentQ.diagram} />
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <LeaderboardModal 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        highlightRecordId={latestRecordId}
        isOwner={ownerAuth.isOwner}
        onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
      />

      {/* Google Sheets Sync Modal (Only if owner) */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsOpen && ownerAuth.isOwner}
        onClose={() => setIsGoogleSheetsOpen(false)}
        records={getStoredRecords()}
      />

      {/* Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={isOwnerAuthModalOpen}
        onClose={() => setIsOwnerAuthModalOpen(false)}
        isOwner={ownerAuth.isOwner}
        ownerEmail={ownerAuth.ownerEmail}
        authMethod={ownerAuth.authMethod}
        onLoginPin={ownerAuth.loginWithPin}
        onLoginGoogle={ownerAuth.loginWithGoogleOwner}
        onLockOrLogout={ownerAuth.lockOrLogout}
        onOpenGoogleSheets={handleOpenGoogleSheets}
        onUpdatePin={ownerAuth.updatePin}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
      
      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
          40%, 60% { transform: translate3d(3px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}
