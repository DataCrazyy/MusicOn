import { Link, useNavigate } from 'react-router-dom';
import { Music2, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listArtists, type DbArtist } from '@/lib/artists';

export default function Entry() {
  const [featured, setFeatured] = useState<DbArtist[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listArtists()
      .then((all) => setFeatured(all.slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="grid min-h-screen lg:grid-cols-2">
        {/* Izquierda — Cliente */}
        <div className="animate-fade-in-up relative flex flex-col justify-between p-8 sm:p-12 lg:p-16">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime">
              <Music2 className="h-6 w-6 text-bg-base" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-ink-primary">
              Music<span className="text-lime">On</span>
            </span>
          </div>

          <div className="py-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-pill bg-bg-raised px-3 py-1.5 text-sm text-ink-muted">
              <Sparkles className="h-4 w-4 text-lime" /> Encontrá al artista ideal para tu evento
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-ink-primary sm:text-6xl lg:text-7xl">
              Reservá música en vivo
              <br />
              <span className="text-lime">en minutos.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Explorá artistas de Bolivia, mandá tu solicitud y coordiná todo directamente con ellos.
              De bodas a fiestas privadas — el sonido correcto está a un click.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="group flex items-center gap-2 rounded-pill bg-lime px-6 py-3.5 font-bold text-bg-base transition hover:bg-lime-dark"
              >
                Explorar artistas
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => navigate('/artista/nuevo')}
                className="flex items-center gap-2 rounded-pill border border-line bg-bg-surface px-6 py-3.5 font-bold text-ink-primary transition hover:border-lime/40"
              >
                Ofrecer mis servicios
              </button>
            </div>
          </div>

          <p className="text-sm text-ink-muted">© 2026 MusicOn</p>
        </div>

        {/* Derecha — Vidriera de artistas */}
        <div className="animate-fade-in-up relative hidden overflow-hidden bg-bg-surface lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-lime/10" />
          {featured.length > 0 ? (
            <div className="relative grid h-full grid-cols-2 gap-4 p-8">
              {featured.map((artist, i) => (
                <Link
                  key={artist.id}
                  to={`/profile/${artist.id}`}
                  className={`group relative overflow-hidden rounded-card ${i % 2 === 1 ? 'mt-12' : ''}`}
                >
                  <img
                    src={artist.photo_url ?? undefined}
                    alt={artist.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-pill bg-lime px-2 py-0.5 text-xs font-bold text-bg-base">
                        {artist.genre}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-ink-primary">
                      {artist.name}
                    </h3>
                    <p className="text-sm text-ink-muted">{artist.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-muted">
              Todavía no hay artistas publicados — ¡sé el primero!
            </div>
          )}
        </div>
      </section>

      {/* CTA para artistas */}
      <section className="border-t border-line bg-bg-surface px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink-primary">
              ¿Sos artista o tenés una banda?
            </h2>
            <p className="mt-2 text-lg text-ink-muted">
              Publicá tu perfil, recibí solicitudes de reserva y manejá tu disponibilidad, todo gratis.
            </p>
          </div>
          <button
            onClick={() => navigate('/artista/nuevo')}
            className="flex flex-shrink-0 items-center gap-2 rounded-pill bg-violet px-6 py-3.5 font-bold text-white transition hover:bg-violet-dark"
          >
            Publicar mi perfil
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
