import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserPlus,
  X,
  Mail,
  User,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  MessageSquare,
  Lock,
  Info,
  KeyRound,
  ScrollText,
} from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { SUPER_LIG_CLUBS_2026 } from '../data/superLigClubs2026';
import { isValidEmailOtp, retryAfterSeconds } from '../lib/auth';
import { COMMUNITY_RULES_BODY, COMMUNITY_RULES_SHORT, COMMUNITY_RULES_TITLE } from '../lib/communityRules';

const OTP_RESEND_COOLDOWN = 60;

const ALL_SUPER_LIG_TEAMS = SUPER_LIG_CLUBS_2026;

const QUICK_AVATARS = ['⚽', '🦁', '🦅', '🟡', '🌊', '⚡', '🔥', '🏆', '👑', '🎯', '👟', '🏟️'];

export const QuickRegisterModal: React.FC = () => {
  const {
    isQuickRegisterOpen,
    setIsQuickRegisterOpen,
    loginUser,
    completeFavoriteClub,
    needsFavoriteClub,
    setPendingAuthAction,
    sendSignupCode,
    finishSignupWithCode,
    sendResetCode,
    finishResetWithCode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'pick-club' | 'reset' | 'verify-signup' | 'verify-reset'>('login');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpResendIn, setOtpResendIn] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedCommunityRules, setAcceptedCommunityRules] = useState(false);
  const [showRulesDetail, setShowRulesDetail] = useState(false);

  useEffect(() => {
    if (otpResendIn <= 0) return;
    const id = window.setTimeout(() => setOtpResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [otpResendIn]);

  if (!isQuickRegisterOpen) return null;

  const verifyingOtp = mode === 'verify-signup' || mode === 'verify-reset';
  const pickingClub = !verifyingOtp && (mode === 'pick-club' || (needsFavoriteClub && mode !== 'register' && mode !== 'reset'));
  const currentSelectedTeam = ALL_SUPER_LIG_TEAMS.find((t) => t.id === selectedTeamId);

  const finishSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsQuickRegisterOpen(false);
      setNickname('');
      setEmail('');
      setPassword('');
      setPassword2('');
      setOtpCode('');
      setErrorMessage('');
      setInfoMessage('');
      setSelectedTeamId('');
      setAcceptedCommunityRules(false);
      setShowRulesDetail(false);
      setMode('login');
    }, 1200);
  };

  const startOtpCooldown = (errorText?: string) => {
    setOtpResendIn(retryAfterSeconds(errorText || '') || OTP_RESEND_COOLDOWN);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();

    if (pickingClub) {
      if (!selectedTeamId) {
        setErrorMessage('Tuttuğunuz kulübü seçmeden devam edemezsiniz.');
        return;
      }
      const clubResult = completeFavoriteClub(selectedTeamId);
      if (!clubResult.ok) {
        setErrorMessage(clubResult.error || 'Kulüp kaydedilemedi.');
        return;
      }
      finishSuccess();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (mode === 'verify-signup' || mode === 'verify-reset') {
      if (!isValidEmailOtp(otpCode)) {
        setErrorMessage('Maildeki 6 haneli kodu gir.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Şifre en az 6 karakter olmalı (Kart Düellosu ile aynı).');
        return;
      }
      if (mode === 'verify-reset' && password !== password2) {
        setErrorMessage('Şifreler eşleşmiyor.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = mode === 'verify-signup'
          ? await finishSignupWithCode({
              email: trimmedEmail,
              token: otpCode,
              nickname: trimmedNickname || trimmedEmail.split('@')[0],
              password,
              favoriteTeamId: selectedTeamId,
              avatar: selectedAvatar,
            })
          : await finishResetWithCode({
              email: trimmedEmail,
              token: otpCode,
              password,
            });
        if (!result.ok) {
          setErrorMessage(result.error || 'Kod doğrulanamadı.');
          return;
        }
        if (result.needsFavoriteClub) {
          setMode('pick-club');
          setInfoMessage('Hesabın açıldı. Puan verebilmek için tuttuğun Süper Lig kulübünü seç.');
          return;
        }
        finishSuccess();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        const sent = await sendResetCode(trimmedEmail);
        if (!sent.ok) {
          setErrorMessage(sent.error || 'Kod gönderilemedi.');
          startOtpCooldown(sent.error);
          return;
        }
        setMode('verify-reset');
        setPassword('');
        setPassword2('');
        setOtpCode('');
        setInfoMessage('6 haneli kod mailine gitti. Gelen kutusu ve spam’e bak.');
        startOtpCooldown();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'login') {
      if (password.length < 6) {
        setErrorMessage('Şifre en az 6 karakter olmalı (Kart Düellosu ile aynı).');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await loginUser(trimmedEmail, password);
        if (!result.ok) {
          if (result.needsEmailConfirm) {
            const sent = await sendSignupCode(trimmedEmail);
            if (sent.ok) {
              setMode('verify-signup');
              setInfoMessage('E-posta henüz onaylı değil. Mailindeki 6 haneli kodu gir.');
              startOtpCooldown();
              return;
            }
          }
          setErrorMessage(result.error || 'Giriş başarısız.');
          return;
        }
        if (result.needsFavoriteClub) {
          setMode('pick-club');
          setInfoMessage('Hesabın açıldı. Puan verebilmek için tuttuğun Süper Lig kulübünü seç.');
          return;
        }
        finishSuccess();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!trimmedNickname) {
      setErrorMessage('Lütfen geçerli bir kullanıcı adı (nickname) giriniz.');
      return;
    }
    if (trimmedNickname.length < 3 || trimmedNickname.length > 25) {
      setErrorMessage('Kullanıcı adı 3-25 karakter olmalı.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalı (Kart Düellosu ile aynı).');
      return;
    }
    if (!selectedTeamId) {
      setErrorMessage('Tuttuğunuz kulübü seçmeden kayıt olamazsınız.');
      return;
    }
    if (!acceptedCommunityRules) {
      setErrorMessage('Kayıt için Tribün Dil Kuralları aydınlatma metnini okuyup onaylamanız gerekir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sent = await sendSignupCode(trimmedEmail);
      if (!sent.ok) {
        setErrorMessage(sent.error || 'Onay kodu gönderilemedi.');
        startOtpCooldown(sent.error);
        return;
      }
      setMode('verify-signup');
      setOtpCode('');
      setInfoMessage('6 haneli onay kodu mailine gitti. Gelen kutusu ve spam’e bak.');
      startOtpCooldown();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSuccess) {
      setIsQuickRegisterOpen(false);
      setPendingAuthAction(null);
      setErrorMessage('');
      setShowRulesDetail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative bg-white border-2 border-emerald-500/40 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-scaleUp text-slate-900 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Emerald Gradient */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <UserPlus className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight tracking-tight text-white">
                  {pickingClub
                    ? 'Tuttuğun Kulübü Seç'
                    : mode === 'verify-signup' || mode === 'verify-reset'
                      ? 'Mailindeki Kodu Yaz'
                      : mode === 'reset'
                        ? 'Şifre Sıfırla'
                        : mode === 'login'
                          ? 'Kart Düellosu Hesabıyla Giriş'
                          : 'Ortak Hesap Oluştur'}
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wide">
                  Ücretsiz
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
                {pickingClub
                  ? 'Kart Düellosu hesabın hazır. Puan ve yorum için Süper Lig kulübünü sen seçmelisin.'
                  : verifyingOtp
                    ? 'Gelen kutusu ve spam’e bak. Kod 6 haneli, Kart Düellosu ile aynı mail gider.'
                    : mode === 'reset'
                      ? 'Mailine 6 haneli kod gelir. Kodu yazıp yeni şifreni belirlersin.'
                      : 'Aynı e-posta ve şifreyle hem siteyi hem Kart Düellosu uygulamasını kullanırsın.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative z-10 shrink-0"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 sm:p-10 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">Hoş Geldiniz{nickname ? `, ${nickname}` : ''}!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {currentSelectedTeam
                  ? <>Kaydınız tamamlandı. <strong>{currentSelectedTeam.name} ({currentSelectedTeam.badge})</strong> taraftarı olarak takımınızın oyuncularına not verebilirsiniz.</>
                  : 'Hesabınız açıldı. Puan vermeden önce tuttuğunuz kulübü seçmeniz gerekir.'}
              </p>
            </div>
            {currentSelectedTeam && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{currentSelectedTeam.name} oyuncularını puanlama hakkınız aktif!</span>
            </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {!pickingClub && !verifyingOtp && mode !== 'reset' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(''); setInfoMessage(''); }}
                className={`py-2 rounded-xl text-xs font-black transition ${mode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); setInfoMessage(''); }}
                className={`py-2 rounded-xl text-xs font-black transition ${mode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}
              >
                Yeni Kayıt
              </button>
            </div>
            )}
            
            {!verifyingOtp && mode !== 'reset' && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border-2 border-amber-400/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-2xs">
                <ShieldAlert className="w-4.5 h-4.5 text-slate-950" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-950 uppercase tracking-wide text-[11px] bg-amber-400/80 px-1.5 py-0.5 rounded">
                    ÖNEMLİ KURAL
                  </span>
                  <span className="font-bold text-amber-900 text-[11px]">
                    Lütfen Desteklediğiniz Takımı Seçiniz
                  </span>
                </div>
                <p className="text-slate-800 font-bold leading-snug">
                  Platformumuzda <span className="underline decoration-amber-500 decoration-2 font-black text-slate-950">yalnızca tuttuğunuz takımın oyuncularına</span> not verebilir ve yorum yapabilirsiniz.
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Tüm diğer takımların puanlarını, maçlarını ve taraftar yorumlarını ise serbestçe inceleyebilirsiniz.
                </p>
              </div>
            </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl p-2.5 flex items-center gap-2 animate-shake">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {infoMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl p-2.5">
                {infoMessage}
              </div>
            )}

            {/* Form Fields: Nickname & Email */}
            <div className="space-y-3.5">
              
              {!pickingClub && !verifyingOtp && mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kullanıcı Adı (Nickname) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Yorum ve puanlarınızda görünecektir
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Örn: TribunKartali, Cimbom1905, KadikoyBoga..."
                    maxLength={25}
                    autoFocus
                    required
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    {nickname.length}/25
                  </div>
                </div>
              </div>
              )}

              {!pickingClub && !verifyingOtp && (
              <>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>E-Posta Adresi <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Güvenliğiniz ve hesabınız için
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
              </div>

              {mode !== 'reset' && (
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Şifre <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kart Düellosu şifren"
                  minLength={6}
                  required={mode !== 'reset'}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setErrorMessage(''); setInfoMessage(''); setPassword(''); }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Şifremi unuttum
                  </button>
                )}
              </div>
              )}
              </>
              )}

              {verifyingOtp && (
              <div className="space-y-3.5">
                <p className="text-xs font-bold text-slate-700 break-all text-center">
                  Kod bu adrese gitti: <span className="text-emerald-800">{email}</span>
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 flex items-center justify-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    Maildeki 6 haneli kod
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border-2 border-emerald-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-3 text-center text-2xl tracking-[0.35em] font-black text-slate-900 placeholder-slate-300 focus:outline-none transition"
                  />
                </div>
                {mode === 'verify-reset' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800">Yeni şifre</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        minLength={6}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800">Yeni şifre tekrar</label>
                      <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        placeholder="Tekrar yaz"
                        minLength={6}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </>
                )}
                <button
                  type="button"
                  disabled={isSubmitting || otpResendIn > 0}
                  onClick={async () => {
                    setErrorMessage('');
                    setIsSubmitting(true);
                    try {
                      const sent = mode === 'verify-signup'
                        ? await sendSignupCode(email)
                        : await sendResetCode(email);
                      if (!sent.ok) {
                        setErrorMessage(sent.error || 'Kod tekrar gönderilemedi.');
                        startOtpCooldown(sent.error);
                        return;
                      }
                      setInfoMessage('Yeni kod mailine gitti. Spam’e de bak.');
                      startOtpCooldown();
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="w-full text-[11px] font-bold text-emerald-800 underline disabled:no-underline disabled:text-slate-400"
                >
                  {otpResendIn > 0
                    ? `Yeni kod ${otpResendIn} saniye sonra istenebilir`
                    : 'Kodu tekrar gönder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'verify-reset' ? 'reset' : 'register');
                    setOtpCode('');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className="w-full text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  Geri dön
                </button>
              </div>
              )}

              {(mode === 'register' || pickingClub) && <>
              {/* Favorite Team Selection (All 18 Süper Lig Clubs) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tuttuğunuz Süper Lig Kulübü <span className="text-rose-500">*</span></span>
                  </label>
                  {currentSelectedTeam ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                    <TeamLogo teamId={currentSelectedTeam.id} teamName={currentSelectedTeam.name} size="xs" shape="circle" showShadow={false} />
                    <span>{currentSelectedTeam.name}</span>
                  </span>
                  ) : (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Henüz seçilmedi
                  </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  ⚡ <strong>Yalnızca bu kulübün oyuncularına not verebilir ve yorum yazabilirsiniz:</strong>
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {ALL_SUPER_LIG_TEAMS.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-700 text-white font-black shadow-sm ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <TeamLogo teamId={team.id} teamName={team.name} size="xs" shape="circle" showShadow={false} className="shrink-0" />
                        <span className="text-xs truncate leading-tight">{team.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === 'register' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>Profil Simgesi Seçin</span>
                  <span className="text-[10px] text-slate-400">İstediğiniz zaman değiştirebilirsiniz</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {QUICK_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition cursor-pointer ${
                        selectedAvatar === emoji
                          ? 'bg-amber-400 scale-110 shadow-xs ring-2 ring-emerald-600'
                          : 'hover:bg-white hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="mt-2 rounded-xl border-2 border-amber-200 bg-amber-50/80 p-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      id="accept-community-rules"
                      type="checkbox"
                      checked={acceptedCommunityRules}
                      onChange={(e) => setAcceptedCommunityRules(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-amber-400 text-emerald-700 focus:ring-emerald-500 shrink-0"
                    />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug">
                      {COMMUNITY_RULES_SHORT}{' '}
                      <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRulesDetail(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    Aydınlatma metninin detayını oku
                  </button>
                </div>
              </div>
              )}
              </>}

            </div>

            {!verifyingOtp && mode !== 'reset' && (
            <div className="bg-slate-100 rounded-xl p-2.5 text-[11px] text-slate-700 flex items-center gap-2 border border-slate-200">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {currentSelectedTeam
                  ? <>Seçiminizle <strong>{currentSelectedTeam.name} ({currentSelectedTeam.badge})</strong> oyuncularına not verebileceksiniz.</>
                  : 'Puan ve yorum için listedeki 18 kulüpten tuttuğunuzu seçmelisiniz. Varsayılan takım atanmaz.'}
              </span>
            </div>
            )}

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'reset' || verifyingOtp) {
                    setMode('login');
                    setOtpCode('');
                    setErrorMessage('');
                    setInfoMessage('');
                    return;
                  }
                  handleClose();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                {mode === 'reset' || verifyingOtp ? 'Girişe Dön' : 'Gözlemlemeye Devam Et'}
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || (mode === 'register' && !acceptedCommunityRules)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-700/30 transition cursor-pointer hover:scale-[1.02] disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'İşleniyor...'
                    : pickingClub
                      ? 'Kulübümü Kaydet'
                      : mode === 'verify-signup'
                        ? 'Kodu Onayla'
                        : mode === 'verify-reset'
                          ? 'Şifreyi Değiştir'
                          : mode === 'reset'
                            ? 'Kod Gönder'
                            : mode === 'login'
                              ? 'Giriş Yap'
                              : 'Kodu Gönder'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

          </form>
        )}

        {showRulesDetail && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col rounded-3xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-start justify-between gap-3 shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Kayıt Aydınlatması</p>
                <h3 className="text-sm sm:text-base font-black leading-snug mt-0.5">{COMMUNITY_RULES_TITLE}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesDetail(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
              {COMMUNITY_RULES_BODY}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRulesDetail(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Forma dön
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcceptedCommunityRules(true);
                  setShowRulesDetail(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
              >
                Okudum, kabul ediyorum
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
