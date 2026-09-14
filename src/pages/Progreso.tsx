import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Lock, Check, Sparkles, Trophy, Zap, Calendar } from 'lucide-react';
import {
  LEVELS, XP_ACTIVITIES, DAILY_CHALLENGES, ACHIEVEMENTS,
  ARTIST_XP, getCurrentLevel, type Level,
} from '@/gamification';

export default function Progreso() {
  const { level, index, nextLevel, xpInLevel, xpForNext } = getCurrentLevel(ARTIST_XP.current);
  const progressPct = nextLevel ? Math.round((xpInLevel / xpForNext) * 100) : 100;

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver al dashboard
        </Link>

        <h1 className="mb-8 font-display text-3xl font-bold text-ink-primary">Mi Progreso</h1>

        {/* HERO SECTION */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Level badge */}
            <div className={`flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 ${level.borderClass} ${level.bgClass}`}>
              <span className="text-4xl">{level.emoji}</span>
            </div>

            {/* XP + streak */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-ink-primary">Nivel {level.name}</span>
                <span className="rounded-pill bg-lime/15 px-3 py-0.5 text-sm font-bold text-lime">{ARTIST_XP.current.toLocaleString()} XP</span>
              </div>

              {/* XP progress bar */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">
                    {ARTIST_XP.current.toLocaleString()} / {nextLevel ? nextLevel.minXp.toLocaleString() : 'MAX'} XP
                    {nextLevel && ` para Nivel ${nextLevel.name}`}
                  </span>
                  <span className="font-bold text-lime">{progressPct}%</span>
                </div>
                <div className="relative h-4 overflow-hidden rounded-full bg-bg-raised">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime to-lime-dark transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
              </div>

              {/* Streak + next reward */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-bg-raised px-3 py-2">
                  <Flame className="h-5 w-5 text-amber" fill="currentColor" />
                  <span className="text-sm font-bold text-ink-primary">{ARTIST_XP.streak}</span>
                  <span className="text-xs text-ink-muted">días seguidos activo</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-lime/5 px-3 py-2">
                  <Sparkles className="h-5 w-5 text-lime" />
                  <span className="text-xs text-ink-muted">Próximo premio:</span>
                  <span className="text-sm font-semibold text-lime">{ARTIST_XP.nextReward}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEVEL PATH */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="mb-6 font-display text-xl font-bold text-ink-primary">Niveles</h2>
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-line" />
            <div
              className="absolute left-6 top-8 w-0.5 bg-gradient-to-b from-lime to-amber transition-all duration-1000"
              style={{ height: `${(index / (LEVELS.length - 1)) * 100 - 10}%` }}
            />

            <div className="space-y-6">
              {LEVELS.map((lvl, i) => {
                const isUnlocked = i <= index;
                const isCurrent = i === index;
                const isLocked = i > index;
                const levelProgress = isCurrent && nextLevel ? Math.round((xpInLevel / xpForNext) * 100) : isUnlocked ? 100 : 0;

                return (
                  <LevelNode
                    key={lvl.id}
                    level={lvl}
                    isUnlocked={isUnlocked}
                    isCurrent={isCurrent}
                    isLocked={isLocked}
                    progress={levelProgress}
                    xpText={isCurrent ? `${ARTIST_XP.current.toLocaleString()}/${nextLevel!.minXp.toLocaleString()} XP` : isUnlocked ? 'Desbloqueado' : `Necesitás ${lvl.minXp.toLocaleString()} XP`}
                    needsPrevious={isLocked && i > index + 1}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* XP EARNING */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-ink-primary">
            <Zap className="h-5 w-5 text-lime" /> Cómo ganar XP
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {XP_ACTIVITIES.map((act) => (
              <div key={act.label} className="flex items-center justify-between rounded-xl border border-line bg-bg-raised p-3 transition hover:border-lime/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{act.icon}</span>
                  <span className="text-sm font-medium text-ink-primary">{act.label}</span>
                </div>
                <span className="rounded-pill bg-lime/10 px-2.5 py-0.5 text-xs font-bold text-lime">{act.xp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DAILY CHALLENGES */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-lime" />
            <h2 className="font-display text-xl font-bold text-ink-primary">Desafíos diarios</h2>
            <span className="ml-auto rounded-pill bg-amber/15 px-2.5 py-0.5 text-xs font-medium text-amber">Se reinicia en 24h</span>
          </div>
          <div className="space-y-3">
            {DAILY_CHALLENGES.map((ch) => (
              <div key={ch.id} className={`rounded-xl border p-4 ${ch.completed ? 'border-lime/30 bg-lime/5' : 'border-line bg-bg-raised'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-primary">{ch.label}</span>
                  {ch.completed ? (
                    <span className="flex items-center gap-1.5 rounded-pill bg-lime px-2.5 py-0.5 text-xs font-bold text-bg-base">
                      <Check className="h-3 w-3" /> +{ch.xpReward} XP
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-ink-muted">{ch.current}/{ch.target}</span>
                  )}
                </div>
                {!ch.completed && (
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lime to-lime-dark transition-all duration-700"
                      style={{ width: `${(ch.current / ch.target) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-ink-primary">
            <Trophy className="h-5 w-5 text-lime" /> Logros
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = ach.status === 'unlocked';
              const isProgress = ach.status === 'progress';
              return (
                <div
                  key={ach.id}
                  className={`flex flex-col items-center rounded-xl border p-4 text-center transition ${
                    isUnlocked
                      ? 'border-lime/30 bg-lime/5'
                      : isProgress
                        ? 'border-line bg-bg-raised'
                        : 'border-line bg-bg-raised opacity-50'
                  }`}
                >
                  <div className={`text-3xl ${!isUnlocked && !isProgress ? 'grayscale' : ''}`}>
                    {isUnlocked ? ach.emoji : isProgress ? ach.emoji : '🔒'}
                  </div>
                  <span className="mt-2 text-xs font-bold text-ink-primary">{ach.label}</span>
                  <span className="mt-0.5 text-[10px] text-ink-muted">{ach.description}</span>
                  {isProgress && ach.progress && (
                    <span className="mt-1.5 rounded-pill bg-amber/15 px-2 py-0.5 text-[10px] font-bold text-amber">
                      {ach.progress.current}/{ach.progress.target}
                    </span>
                  )}
                  {isUnlocked && (
                    <span className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-lime">
                      <Check className="h-3 w-3" /> Desbloqueado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function LevelNode({
  level, isUnlocked, isCurrent, isLocked, progress, xpText, needsPrevious,
}: {
  level: Level;
  isUnlocked: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  progress: number;
  xpText: string;
  needsPrevious: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Circle node */}
      <div className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 ring-4 ring-bg-base ${
        isUnlocked ? `${level.borderClass} ${level.bgClass}` : 'border-line bg-bg-raised'
      }`}>
        {isUnlocked ? (
          <span className="text-xl">{level.emoji}</span>
        ) : (
          <Lock className="h-5 w-5 text-ink-muted" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 rounded-xl border p-4 ${
        isCurrent ? `border-lime/30 bg-lime/5` : isUnlocked ? 'border-line bg-bg-raised' : 'border-line bg-bg-raised opacity-50'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`font-display text-lg font-bold ${isUnlocked ? level.textClass : 'text-ink-muted'}`}>
            {level.emoji} {level.name}
          </span>
          <span className={`text-xs font-medium ${
            isCurrent ? 'text-lime' : isUnlocked ? 'text-lime' : 'text-ink-muted'
          }`}>
            {isUnlocked && !isCurrent ? 'Desbloqueado ✓' : isCurrent ? 'En progreso' : needsPrevious ? 'Necesitás nivel anterior' : ''}
          </span>
        </div>

        {isCurrent && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-muted">{xpText}</span>
              <span className="font-bold text-lime">{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime to-lime-dark transition-all duration-1000"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          {level.rewards.map((reward) => (
            <div key={reward} className="flex items-center gap-2 text-sm">
              {isUnlocked ? (
                <Check className="h-4 w-4 flex-shrink-0 text-lime" />
              ) : (
                <Lock className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted" />
              )}
              <span className={isUnlocked ? 'text-ink-primary' : 'text-ink-muted'}>{reward}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
