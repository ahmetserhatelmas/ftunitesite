import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  Flag,
  Flame,
  Radio,
  FileWarning,
} from 'lucide-react';

const SPAM_REASONS = [
  {
    id: 'profanity',
    title: 'Küfür, Hakaret veya Taciz',
    description: 'Futbolcuya, hakeme, kulübe veya diğer kullanıcılara yönelik argo, küfür ve saldırgan dil.',
    icon: ShieldAlert,
    badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    id: 'spam_ads',
    title: 'Spam, Reklam veya Tanıtım',
    description: 'Ticari bağlantılar, bahis reklamları, sosyal medya tanıtımları veya anlamsız metin tekrarı.',
    icon: Flag,
    badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'hate_speech',
    title: 'Fanatizm & Nefret Söylemi',
    description: 'Tribün şiddetini öven, nefret suçu içeren, ayrımcı veya kışkırtıcı fanatik ifadeler.',
    icon: Flame,
    badgeColor: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    id: 'off_topic',
    title: 'Yanıltıcı veya Konu Dışı İçerik',
    description: 'Karşılaşmayla veya puanlanan futbolcuyla hiçbir alakası olmayan yanıltıcı bilgiler.',
    icon: FileWarning,
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'other',
    title: 'Diğer Uygunsuz Davranış',
    description: 'Platform kurallarını ihlal eden diğer durumlar.',
    icon: AlertTriangle,
    badgeColor: 'text-slate-600 bg-slate-100 border-slate-200',
  },
];

export const SpamReportModal: React.FC = () => {
  const { spamReportingReview, setSpamReportingReview, reportSpamReview } = useApp();
  const [selectedReasonId, setSelectedReasonId] = useState<string>('profanity');
  const [reportNote, setReportNote] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!spamReportingReview) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonObj = SPAM_REASONS.find((r) => r.id === selectedReasonId);
    const reasonTitle = reasonObj ? reasonObj.title : 'Uygunsuz İçerik';

    reportSpamReview(spamReportingReview.id, reasonTitle, reportNote.trim());
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setSpamReportingReview(null);
      setReportNote('');
      setSelectedReasonId('profanity');
    }, 1200);
  };

  const handleClose = () => {
    if (!isSubmitted) {
      setSpamReportingReview(null);
      setReportNote('');
      setSelectedReasonId('profanity');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Yorumu Şikayet Et & Bildir</h3>
              <p className="text-[11px] text-white/80 font-medium">
                Topluluk kurallarını ihlal eden yorumları moderasyon ekibimize bildirin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Bildiriminiz Alındı!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Şikayetiniz moderasyon sistemimize iletildi. İncelenip uygunsuz bulunan yorumlar en kısa sürede kaldırılacaktır.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Reported Comment Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                  <span>Şikayet Edilen Yorum:</span>
                </span>
                <span className="text-[11px] font-black text-slate-900">
                  {spamReportingReview.authorName}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic line-clamp-2 bg-white p-2 rounded-xl border border-slate-100">
                "{spamReportingReview.comment || 'Puanlama değerlendirmesi'}"
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                Lütfen şikayet nedeninizi seçin:
              </label>
              <div className="space-y-2">
                {SPAM_REASONS.map((reason) => {
                  const Icon = reason.icon;
                  const isSelected = selectedReasonId === reason.id;
                  return (
                    <div
                      key={reason.id}
                      onClick={() => setSelectedReasonId(reason.id)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-300'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${reason.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-rose-950' : 'text-slate-900'}`}>
                            {reason.title}
                          </span>
                          <input
                            type="radio"
                            name="spam_reason"
                            checked={isSelected}
                            onChange={() => setSelectedReasonId(reason.id)}
                            className="text-rose-600 accent-rose-600 shrink-0"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Note Field with 200 char limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-700">
                  Ek Açıklama (İsteğe Bağlı):
                </label>
                <span className="text-slate-400 font-mono">
                  {reportNote.length} / 200
                </span>
              </div>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={2}
                placeholder="Şikayetinizle ilgili moderatörlerimize iletmek istediğiniz ek detay varsa buraya yazabilirsiniz..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Şikayeti Gönder</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
