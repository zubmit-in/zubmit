"use client";

const map: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  PENDING:     { bg: 'rgba(232,114,42,0.12)',  border: 'rgba(232,114,42,0.25)',  text: '#f4954e', dot: '#e8722a', label: 'Pending' },
  CONFIRMED:   { bg: 'rgba(232,114,42,0.15)',  border: 'rgba(232,114,42,0.3)',   text: '#f4954e', dot: '#e8722a', label: 'Confirmed' },
  ASSIGNED:    { bg: 'rgba(255,184,48,0.1)',  border: 'rgba(255,184,48,0.25)', text: '#ffcb6b', dot: '#ffb830', label: 'Assigned' },
  IN_PROGRESS: { bg: 'rgba(255,184,48,0.12)', border: 'rgba(255,184,48,0.3)',  text: '#ffb830', dot: '#ff9900', label: 'In Progress' },
  DELIVERED:   { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)', text: '#c084fc', dot: '#a855f7', label: 'Delivered' },
  COMPLETED:   { bg: 'rgba(34,217,138,0.1)',  border: 'rgba(34,217,138,0.25)', text: '#22d98a', dot: '#22d98a', label: 'Completed' },
  CANCELLED:   { bg: 'rgba(255,71,87,0.1)',   border: 'rgba(255,71,87,0.25)',  text: '#ff4757', dot: '#ff4757', label: 'Cancelled' },
  REVISION:    { bg: 'rgba(255,71,87,0.1)',   border: 'rgba(255,71,87,0.25)',  text: '#ff4757', dot: '#ff4757', label: 'Revision' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = map[status] || { bg: 'var(--hover-bg)', border: 'var(--b2)', text: 'var(--t3)', dot: 'var(--t3)', label: status };
  const isPulsing = status === 'IN_PROGRESS';

  return (
    <span
      className="inline-flex items-center gap-1.5 font-outfit"
      style={{
        padding: '5px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        border: `1px solid ${config.border}`,
        background: config.bg,
        color: config.text,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: config.dot,
          display: 'block',
          flexShrink: 0,
          animation: isPulsing ? 'dotPulse 1.5s ease-in-out infinite' : undefined,
        }}
      />
      {config.label}
    </span>
  );
}
