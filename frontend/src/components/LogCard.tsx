import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { DateLog } from '../api';

export const LogCard = memo(function LogCard({ log }: { log: DateLog }) {
  const rating = log.a_rating ?? 0;
  return (
    <Link
      to={`/logs/${log.id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-paper transition active:scale-[.98]"
    >
      <div className="aspect-square w-full bg-cream">
        {log.photo_url ? (
          <img src={log.photo_url} alt={log.place_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-ink-3">📷</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[11px] uppercase tracking-wider text-ink-3">{log.date}</div>
        <div className="mt-0.5 truncate font-bold text-ink">{log.place_name}</div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {rating > 0 ? (
            <span className="text-terracotta">{'★'.repeat(rating)}<span className="text-line-2">{'★'.repeat(5 - rating)}</span></span>
          ) : (
            <span className="text-ink-3">{log.completed ? '미평가' : '미이행'}</span>
          )}
        </div>
      </div>
    </Link>
  );
});
