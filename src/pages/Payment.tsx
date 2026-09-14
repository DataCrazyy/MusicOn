import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, Lock, CheckCircle2, Loader2, Upload, CreditCard,
  Smartphone, Sparkles, Clock, RefreshCw, HelpCircle,
} from 'lucide-react';
import { getArtist, getComboDiscount, type Artist } from '@/data';
import { useToast } from '@/components/Toast';

type PaymentMethod = 'qr' | 'tigo' | 'bank' | 'card';

const QR_GRID_SIZE = 25;
const QR_COMPATIBLE_APPS = ['Tigo Money', 'BNB', 'Banco Unión', 'SimpleBank', 'Bisa', 'FIE'];

function generateQRPattern(seed: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < QR_GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < QR_GRID_SIZE; c++) {
      // Finder patterns (3 corners)
      const isFinder = (r: number, c: number, baseR: number, baseC: number) => {
        const dr = r - baseR;
        const dc = c - baseC;
        if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
        if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
        if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
        return false;
      };
      const corners: [number, number][] = [[0, 0], [0, QR_GRID_SIZE - 7], [QR_GRID_SIZE - 7, 0]];
      let found = false;
      for (const [br, bc] of corners) {
        const res = isFinder(r, c, br, bc);
        if (res !== null) { grid[r][c] = res; found = true; break; }
      }
      if (found) continue;
      // Timing patterns
      if (r === 6 || c === 6) { grid[r][c] = (r + c) % 2 === 0; continue; }
      // Pseudo-random data cells
      const hash = (r * 31 + c * 17 + seed * 13) % 100;
      grid[r][c] = hash < 48;
    }
  }
  return grid;
}

function QRCode({ seed }: { seed: number }) {
  const pattern = generateQRPattern(seed);
  const cellSize = 8;
  const size = QR_GRID_SIZE * cellSize;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="#ffffff" />
      {pattern.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1a1a22"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const comboIds = params.get('combo');
  const singleArtistId = params.get('artist');
  const date = params.get('date') || '';
  const eventType = params.get('event') || '';
  const extrasTotal = Number(params.get('extras') || '0');

  const comboArtists: Artist[] = comboIds
    ? comboIds.split(',').map((id) => getArtist(id)).filter(Boolean) as Artist[]
    : singleArtistId
      ? [getArtist(singleArtistId)].filter(Boolean) as Artist[]
      : [];

  const isCombo = comboIds !== null && comboArtists.length > 1;
  const discount = isCombo ? getComboDiscount(comboArtists.length) : 0;
  const subtotal = comboArtists.reduce((s, a) => s + a.priceFrom, 0) + extrasTotal;
  const discountAmount = Math.round(subtotal * discount);
  const commission = Math.round((subtotal - discountAmount) * 0.15);
  const grandTotal = subtotal - discountAmount + commission;
  const deposit = Math.round(grandTotal * 0.30);

  const [method, setMethod] = useState<PaymentMethod>('qr');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // QR state
  const [qrSeed, setQrSeed] = useState(() => Date.now());
  const [qrSeconds, setQrSeconds] = useState(600);
  const [qrExpired, setQrExpired] = useState(false);
  const [qrConfirming, setQrConfirming] = useState(false);

  useEffect(() => {
    if (method !== 'qr' || qrExpired) return;
    const timer = setInterval(() => {
      setQrSeconds((prev) => {
        if (prev <= 1) {
          setQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [method, qrExpired]);

  const regenerateQR = () => {
    setQrSeed(Date.now());
    setQrSeconds(600);
    setQrExpired(false);
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Tigo Money
  const [tigoPhone, setTigoPhone] = useState('');

  // Bank transfer
  const [bankFile, setBankFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const detectCardType = (num: string): 'visa' | 'mastercard' | null => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean)) return 'mastercard';
    return null;
  };

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (method === 'tigo') {
      const clean = tigoPhone.replace(/\D/g, '');
      if (clean.length !== 8 || !clean.startsWith('7')) {
        e.tigoPhone = 'El número debe tener 8 dígitos y empezar con 7';
      }
    } else if (method === 'bank') {
      if (!bankFile) e.bankFile = 'Subí el comprobante de transferencia';
    } else if (method === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length !== 16) e.cardNumber = 'El número de tarjeta debe tener 16 dígitos';
      if (!cardName.trim()) e.cardName = 'Ingresá el nombre del titular';
      const [mm, yy] = cardExpiry.split('/');
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) {
        e.cardExpiry = 'Fecha inválida (MM/YY)';
      } else if (Number(yy) < currentYear || (Number(yy) === currentYear && Number(mm) < currentMonth)) {
        e.cardExpiry = 'La tarjeta está vencida';
      }
      if (cardCvv.length !== 3) e.cardCvv = 'El CVV debe tener 3 dígitos';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const proceedToConfirmation = (methodLabel: string) => {
    const txId = Math.floor(10000000 + Math.random() * 89999999).toString();
    const now = new Date();
    const payDate = now.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const payTime = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    const navParams = new URLSearchParams();
    if (comboIds) navParams.set('combo', comboIds);
    else if (singleArtistId) navParams.set('artist', singleArtistId);
    navParams.set('date', date);
    navParams.set('total', grandTotal.toString());
    navParams.set('deposit', deposit.toString());
    navParams.set('txId', txId);
    navParams.set('payDate', `${payDate} ${payTime}`);
    navParams.set('payMethod', methodLabel);
    navigate(`/confirmation?${navParams.toString()}`);
  };

  const handlePay = () => {
    if (method === 'qr') {
      if (qrExpired) {
        showToast('El QR expiró. Generá uno nuevo.');
        return;
      }
      showToast('Escaneá el QR para pagar');
      return;
    }
    if (!validate()) {
      showToast('Revisá los campos marcados en rojo');
      return;
    }
    setProcessing(true);
    const methodLabel = method === 'tigo' ? 'Tigo Money' : method === 'bank' ? 'Transferencia bancaria' : 'Tarjeta';
    setTimeout(() => proceedToConfirmation(methodLabel), 2000);
  };

  const handleQrConfirm = () => {
    setQrConfirming(true);
    setTimeout(() => proceedToConfirmation('QR'), 2000);
  };

  const cardType = detectCardType(cardNumber);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/booking" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver a la reserva
        </Link>

        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 text-lime" />
          <h1 className="font-display text-2xl font-bold text-ink-primary">Pagar anticipo seguro</h1>
        </div>
        <p className="mb-8 text-sm text-ink-muted">Tu pago está protegido por MusicOn Escrow</p>

        {/* Order summary */}
        <div className="mb-6 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-primary">Resumen del pedido</h2>

          {comboArtists.map((a) => (
            <div key={a.id} className="mb-3 flex items-center gap-3 border-b border-line/50 pb-3 last:border-0">
              <img src={a.photo} alt={a.name} className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-ink-primary">{a.name}</p>
                <p className="text-xs text-ink-muted">{a.genre} · {eventType || 'Evento'}</p>
              </div>
              <span className="text-sm font-semibold text-ink-primary">${a.priceFrom}</span>
            </div>
          ))}

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink-primary">${subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1 font-medium text-lime">
                  <Sparkles className="h-3.5 w-3.5" /> Descuento combo ({Math.round(discount * 100)}%)
                </span>
                <span className="font-bold text-lime">−${discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-muted">Comisión MusicOn (15%)</span>
              <span className="font-semibold text-ink-primary">${commission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <span className="font-bold text-ink-primary">Total</span>
              <span className="font-display text-lg font-bold text-ink-primary">${grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-baseline justify-between rounded-lg bg-lime/10 px-3 py-2.5">
              <span className="text-sm font-medium text-lime">Anticipo a pagar ahora (30%)</span>
              <span className="font-display text-2xl font-extrabold text-lime">${deposit.toLocaleString()}</span>
            </div>
            <p className="text-xs text-ink-muted">
              Saldo restante: ${(grandTotal - deposit).toLocaleString()} — se paga directamente al artista el día del evento.
            </p>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="mb-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-primary">Método de pago</h2>
          <div className="space-y-3">
            {/* QR */}
            <button
              onClick={() => { setMethod('qr'); setErrors({}); }}
              className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${
                method === 'qr' ? 'border-lime bg-lime/5' : 'border-line bg-bg-surface hover:border-lime/30'
              }`}
            >
              <span className="text-3xl">📱</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-primary">Pagar con QR</span>
                  <span className="rounded-pill bg-lime/15 px-2 py-0.5 text-xs font-bold text-lime">Más rápido</span>
                </div>
                <p className="text-xs text-ink-muted">Escaneá con tu app bancaria o billetera digital</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${method === 'qr' ? 'border-lime bg-lime' : 'border-line'}`} />
            </button>
            {method === 'qr' && (
              <div className="animate-slide-up rounded-card border border-line bg-bg-surface p-6">
                <div className="flex flex-col items-center">
                  {/* QR code */}
                  {!qrExpired ? (
                    <div className="rounded-xl bg-white p-4 shadow-lg">
                      <QRCode seed={qrSeed} />
                    </div>
                  ) : (
                    <div className="flex h-[200px] w-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-coral/40 bg-coral/5">
                      <span className="text-sm font-semibold text-coral">QR expirado</span>
                      <span className="mt-1 text-xs text-ink-muted">Generá uno nuevo</span>
                    </div>
                  )}

                  <p className="mt-4 text-sm text-ink-muted">Escaneá con tu app bancaria o billetera digital</p>

                  {/* Compatible apps */}
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {QR_COMPATIBLE_APPS.map((app) => (
                      <span key={app} className="rounded-pill border border-line bg-bg-raised px-3 py-1 text-xs font-medium text-ink-muted">
                        {app}
                      </span>
                    ))}
                  </div>

                  {/* Amount */}
                  <div className="mt-5 flex items-baseline gap-2 rounded-lg bg-lime/10 px-5 py-3">
                    <span className="text-sm font-medium text-lime">Monto a pagar</span>
                    <span className="font-display text-2xl font-extrabold text-lime">USD {deposit.toFixed(2)}</span>
                  </div>

                  {/* Countdown timer */}
                  {!qrExpired ? (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-amber" />
                      <span className="text-ink-muted">QR válido por</span>
                      <span className="font-mono font-bold text-amber">{formatCountdown(qrSeconds)}</span>
                      <span className="text-ink-muted">minutos</span>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      <span className="text-sm font-medium text-coral">QR expirado — Generá uno nuevo</span>
                      <button
                        onClick={regenerateQR}
                        className="flex items-center gap-2 rounded-pill bg-lime px-5 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
                      >
                        <RefreshCw className="h-4 w-4" /> Regenerar QR
                      </button>
                    </div>
                  )}

                  {/* ¿Ya pagaste? */}
                  {!qrExpired && (
                    <button
                      onClick={handleQrConfirm}
                      disabled={qrConfirming}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-pill border border-lime/40 bg-lime/10 py-3 text-sm font-bold text-lime transition hover:bg-lime/20 disabled:opacity-60"
                    >
                      {qrConfirming ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando pago...</>
                      ) : (
                        <><HelpCircle className="h-4 w-4" /> ¿Ya pagaste?</>
                      )}
                    </button>
                  )}

                  {/* QR note */}
                  <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
                    El QR se genera con el monto exacto del anticipo. Tu pago queda retenido en escrow automáticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Tigo Money */}
            <button
              onClick={() => { setMethod('tigo'); setErrors({}); }}
              className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${
                method === 'tigo' ? 'border-lime bg-lime/5' : 'border-line bg-bg-surface hover:border-lime/30'
              }`}
            >
              <span className="text-3xl">🟣</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-primary">Tigo Money</span>
                  <span className="rounded-pill bg-lime/15 px-2 py-0.5 text-xs font-bold text-lime">Recomendado</span>
                </div>
                <p className="text-xs text-ink-muted">Pagá en segundos desde tu celular</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${method === 'tigo' ? 'border-lime bg-lime' : 'border-line'}`} />
            </button>
            {method === 'tigo' && (
              <div className="animate-slide-up rounded-card border border-line bg-bg-surface p-4">
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Número de celular Tigo</label>
                <input
                  value={tigoPhone}
                  onChange={(e) => setTigoPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="70012345"
                  className={`w-full rounded-input border bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                    errors.tigoPhone ? 'border-coral focus:border-coral' : 'border-line focus:border-lime/50'
                  }`}
                />
                {errors.tigoPhone && <p className="mt-1.5 text-xs text-coral">{errors.tigoPhone}</p>}
              </div>
            )}

            {/* Bank transfer */}
            <button
              onClick={() => { setMethod('bank'); setErrors({}); }}
              className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${
                method === 'bank' ? 'border-lime bg-lime/5' : 'border-line bg-bg-surface hover:border-lime/30'
              }`}
            >
              <span className="text-3xl">🔵</span>
              <div className="flex-1">
                <span className="font-semibold text-ink-primary">Transferencia bancaria</span>
                <p className="text-xs text-ink-muted">Banco Nacional de Bolivia</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${method === 'bank' ? 'border-lime bg-lime' : 'border-line'}`} />
            </button>
            {method === 'bank' && (
              <div className="animate-slide-up rounded-card border border-line bg-bg-surface p-4">
                <div className="space-y-1.5 rounded-lg bg-bg-raised p-4 text-sm">
                  <div className="flex justify-between"><span className="text-ink-muted">Banco:</span><span className="font-medium text-ink-primary">Banco Nacional de Bolivia</span></div>
                  <div className="flex justify-between"><span className="text-ink-muted">Cuenta:</span><span className="font-medium text-ink-primary">1234567890</span></div>
                  <div className="flex justify-between"><span className="text-ink-muted">Titular:</span><span className="font-medium text-ink-primary">MusicOn SRL</span></div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setBankFile(e.target.files?.[0]?.name || null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-pill border py-3 text-sm font-bold transition ${
                    bankFile ? 'border-lime/40 bg-lime/10 text-lime' : 'border-line bg-bg-raised text-ink-primary hover:border-lime/30'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  {bankFile ? `✓ ${bankFile}` : 'Subir comprobante'}
                </button>
                {errors.bankFile && <p className="mt-1.5 text-xs text-coral">{errors.bankFile}</p>}
              </div>
            )}

            {/* Card */}
            <button
              onClick={() => { setMethod('card'); setErrors({}); }}
              className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${
                method === 'card' ? 'border-lime bg-lime/5' : 'border-line bg-bg-surface hover:border-lime/30'
              }`}
            >
              <span className="text-3xl">💳</span>
              <div className="flex-1">
                <span className="font-semibold text-ink-primary">Tarjeta de crédito/débito</span>
                <p className="text-xs text-ink-muted">Visa · Mastercard</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${method === 'card' ? 'border-lime bg-lime' : 'border-line'}`} />
            </button>
            {method === 'card' && (
              <div className="animate-slide-up space-y-3 rounded-card border border-line bg-bg-surface p-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Número de tarjeta</label>
                  <div className="relative">
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className={`w-full rounded-input border bg-bg-raised px-4 py-3 pr-12 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                        errors.cardNumber ? 'border-coral focus:border-coral' : 'border-line focus:border-lime/50'
                      }`}
                    />
                    {cardType && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                        {cardType === 'visa' ? 'VISA' : 'MC'}
                      </span>
                    )}
                  </div>
                  {errors.cardNumber && <p className="mt-1.5 text-xs text-coral">{errors.cardNumber}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Titular de la tarjeta</label>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Nombre completo"
                    className={`w-full rounded-input border bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                      errors.cardName ? 'border-coral focus:border-coral' : 'border-line focus:border-lime/50'
                    }`}
                  />
                  {errors.cardName && <p className="mt-1.5 text-xs text-coral">{errors.cardName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-muted">Vencimiento (MM/YY)</label>
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className={`w-full rounded-input border bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                        errors.cardExpiry ? 'border-coral focus:border-coral' : 'border-line focus:border-lime/50'
                      }`}
                    />
                    {errors.cardExpiry && <p className="mt-1.5 text-xs text-coral">{errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-muted">CVV</label>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="000"
                      className={`w-full rounded-input border bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                        errors.cardCvv ? 'border-coral focus:border-coral' : 'border-line focus:border-lime/50'
                      }`}
                    />
                    {errors.cardCvv && <p className="mt-1.5 text-xs text-coral">{errors.cardCvv}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-lime" /> SSL Seguro</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-lime" /> Pago protegido</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-lime" /> Datos encriptados</span>
        </div>

        {/* Pay button (hidden for QR — QR uses "¿Ya pagaste?" instead) */}
        {method !== 'qr' && (
          <button
            onClick={handlePay}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-4 font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
          >
            {processing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Procesando pago...</>
            ) : (
              <>Pagar USD ${deposit.toLocaleString()} ahora →</>
            )}
          </button>
        )}

        {/* Trust section */}
        <div className="mt-6 flex items-start gap-3 rounded-card border border-lime/20 bg-lime/5 p-4">
          <Shield className="h-5 w-5 flex-shrink-0 text-lime" />
          <p className="text-xs leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink-primary">Pago 100% seguro.</span> MusicOn retiene tu pago en escrow hasta que el evento se realice exitosamente. Si el artista cancela, recibís el reembolso completo en 24 horas.
          </p>
        </div>
      </div>
    </div>
  );
}
