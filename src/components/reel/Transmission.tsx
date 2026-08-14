'use client';

import { FormEvent, useState } from 'react';
import { site } from '@/data/site';

type Status = 'idle' | 'loading' | 'ok' | 'err';

export default function Transmission() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      subject: String(form.get('subject') || 'From the reel'),
      message: String(form.get('message') || ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed');
      }
      setStatus('ok');
      e.currentTarget.reset();
    } catch (err) {
      setStatus('err');
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section id="signal" className="bg-ink relative px-6 py-28 md:px-16">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-ember font-mono text-[11px] tracking-[0.32em] uppercase">
            Signal
          </p>
          <h2 className="font-display text-ivory mt-4 text-[clamp(2.6rem,7vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
            Write if the work fits.
          </h2>
          <div className="text-ivory/55 mt-10 space-y-3 font-mono text-[12px] tracking-[0.18em] uppercase">
            <a
              href={`mailto:${site.email}`}
              className="hover:text-ember block transition"
            >
              {site.email}
            </a>
            <p>{site.phone}</p>
            <p>{site.location}</p>
          </div>
          <div className="mt-10 flex gap-6 font-mono text-[11px] tracking-[0.22em] uppercase">
            <a
              href={site.social.github}
              target="_blank"
              rel="noreferrer"
              className="text-ivory/50 hover:text-ember"
            >
              GitHub
            </a>
            <a
              href={site.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-ivory/50 hover:text-ember"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <label className="block">
            <span className="text-ivory/40 font-mono text-[10px] tracking-[0.24em] uppercase">
              From
            </span>
            <input
              required
              name="name"
              className="border-ivory/20 text-ivory placeholder:text-ivory/25 focus:border-ember mt-2 w-full border-b bg-transparent py-3 outline-none"
              placeholder="Name"
            />
          </label>
          <label className="block">
            <span className="text-ivory/40 font-mono text-[10px] tracking-[0.24em] uppercase">
              Reply path
            </span>
            <input
              required
              type="email"
              name="email"
              className="border-ivory/20 text-ivory placeholder:text-ivory/25 focus:border-ember mt-2 w-full border-b bg-transparent py-3 outline-none"
              placeholder="Email"
            />
          </label>
          <label className="block">
            <span className="text-ivory/40 font-mono text-[10px] tracking-[0.24em] uppercase">
              Subject
            </span>
            <input
              name="subject"
              className="border-ivory/20 text-ivory placeholder:text-ivory/25 focus:border-ember mt-2 w-full border-b bg-transparent py-3 outline-none"
              placeholder="Role or problem"
            />
          </label>
          <label className="block">
            <span className="text-ivory/40 font-mono text-[10px] tracking-[0.24em] uppercase">
              Body
            </span>
            <textarea
              required
              name="message"
              rows={5}
              className="border-ivory/20 text-ivory placeholder:text-ivory/25 focus:border-ember mt-2 w-full resize-y border-b bg-transparent py-3 outline-none"
              placeholder="What needs building?"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'loading'}
            data-cursor="hot"
            className="text-ember hover:text-ivory font-mono text-[12px] tracking-[0.28em] uppercase transition disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending' : 'Transmit'}
          </button>
          {status === 'ok' ? (
            <p className="text-brass font-mono text-[11px] tracking-[0.2em] uppercase">
              Received.
            </p>
          ) : null}
          {status === 'err' ? (
            <p className="text-ember text-sm">{error}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
