import React from 'react';

export function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[84px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}