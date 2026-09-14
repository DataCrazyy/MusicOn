import { Link } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, Heart, CreditCard, Bell, Shield, Edit2, Check, FileText, Clock } from 'lucide-react';
import { ARTISTS, BOOKINGS, getArtist } from '@/data';
import { useToast } from '@/components/Toast';
import { useState } from 'react';

const CONTRACT_STATUSES: Record<string, 'signed' | 'pending'> = {
  b1: 'pending',
  b2: 'signed',
  b3: 'pending',
  b4: 'signed',
};

export default function ClientProfile() {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('Jamie Doe');
  const [email, setEmail] = useState('jamie.doe@email.com');
  const [city, setCity] = useState('Austin, TX');
  const [notifications, setNotifications] = useState({
    bookings: true,
    messages: true,
    promotions: false,
  });

  const saved = ARTISTS.slice(2, 5);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-display text-3xl font-bold text-ink-primary">My Profile</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Profile info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Account */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-primary">Account</h2>
                <button
                  onClick={() => {
                    if (editing) { showToast('Profile updated'); }
                    setEditing(!editing);
                  }}
                  className="flex items-center gap-1.5 text-sm text-lime hover:underline"
                >
                  {editing ? <><Check className="h-4 w-4" /> Save</> : <><Edit2 className="h-4 w-4" /> Edit</>}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lime text-2xl font-bold text-bg-base">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-ink-primary">{name}</p>
                  <p className="text-sm text-ink-muted">Member since Aug 2026</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <FieldRow icon={User} label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editing}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-lime/50 focus:outline-none disabled:opacity-60"
                  />
                </FieldRow>
                <FieldRow icon={Mail} label="Email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!editing}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-lime/50 focus:outline-none disabled:opacity-60"
                  />
                </FieldRow>
                <FieldRow icon={MapPin} label="City">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!editing}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-lime/50 focus:outline-none disabled:opacity-60"
                  />
                </FieldRow>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Notifications</h2>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  icon={Calendar}
                  label="Booking updates"
                  desc="Status changes and reminders"
                  checked={notifications.bookings}
                  onChange={(v) => setNotifications({ ...notifications, bookings: v })}
                />
                <ToggleRow
                  icon={Mail}
                  label="Messages"
                  desc="New messages from artists"
                  checked={notifications.messages}
                  onChange={(v) => setNotifications({ ...notifications, messages: v })}
                />
                <ToggleRow
                  icon={Bell}
                  label="Promotions"
                  desc="Deals and featured artists"
                  checked={notifications.promotions}
                  onChange={(v) => setNotifications({ ...notifications, promotions: v })}
                />
              </div>
            </section>

            {/* Payment method */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Payment Method</h2>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-bg-raised p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-bg-elevated">
                    <CreditCard className="h-5 w-5 text-ink-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">•••• •••• •••• 4242</p>
                    <p className="text-xs text-ink-muted">Expires 09/28</p>
                  </div>
                </div>
                <button onClick={() => showToast('Card management coming soon')} className="text-sm text-lime hover:underline">
                  Manage
                </button>
              </div>
            </section>
          </div>

          {/* Right: Saved artists + security */}
          <div className="space-y-6">
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-lg font-bold text-ink-primary">Saved Artists</h2>
              <div className="mt-4 space-y-3">
                {saved.map((a) => (
                  <Link
                    key={a.id}
                    to={`/profile/${a.id}`}
                    className="group flex items-center gap-3 rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated"
                  >
                    <img src={a.photo} alt={a.name} className="h-10 w-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-primary group-hover:text-lime">{a.name}</p>
                      <p className="text-xs text-ink-muted">{a.genre}</p>
                    </div>
                    <Heart className="h-4 w-4 fill-coral text-coral" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Documents */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-lime" />
                <h2 className="font-display text-lg font-bold text-ink-primary">Documentos</h2>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Tus contratos digitales</p>
              <div className="mt-4 space-y-2">
                {BOOKINGS.slice(0, 3).map((b) => {
                  const artist = getArtist(b.artistId);
                  if (!artist) return null;
                  const status = CONTRACT_STATUSES[b.id] || 'pending';
                  return (
                    <Link
                      key={b.id}
                      to={`/contrato/${b.id}`}
                      className="group flex items-center gap-3 rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated">
                        <FileText className="h-4 w-4 text-ink-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-primary">{artist.name}</p>
                        <p className="text-[10px] text-ink-muted">{b.event}</p>
                      </div>
                      <span className={`flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-[10px] font-bold ${
                        status === 'signed' ? 'bg-teal/15 text-teal' : 'bg-amber/15 text-amber'
                      }`}>
                        {status === 'signed' ? <Check className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {status === 'signed' ? 'Firmado' : 'Pendiente'}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <Link
                to="/documentos"
                className="mt-3 flex items-center justify-center gap-2 rounded-pill border border-line bg-bg-raised py-2 text-xs font-bold text-ink-primary transition hover:border-lime/40"
              >
                Ver todos los documentos →
              </Link>
            </section>

            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-lg font-bold text-ink-primary">Security</h2>
              <div className="mt-4 space-y-2">
                <button onClick={() => showToast('Password change link sent to email')} className="flex w-full items-center justify-between rounded-xl bg-bg-raised p-3 text-sm text-ink-primary transition hover:bg-bg-elevated">
                  <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-lime" /> Change password</span>
                </button>
                <div className="flex items-center justify-between rounded-xl bg-bg-raised p-3">
                  <span className="flex items-center gap-2 text-sm text-ink-primary">
                    <Shield className="h-4 w-4 text-teal" /> 2FA
                  </span>
                  <span className="rounded-pill bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">Enabled</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-ink-muted">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, desc, checked, onChange }: { icon: typeof User; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-bg-raised p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-ink-muted" />
        <div>
          <p className="text-sm font-semibold text-ink-primary">{label}</p>
          <p className="text-xs text-ink-muted">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-lime' : 'bg-bg-elevated'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
