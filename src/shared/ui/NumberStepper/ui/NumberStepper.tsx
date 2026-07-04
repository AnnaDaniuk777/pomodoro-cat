import { useState } from 'react';

type NumberStepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function NumberStepper({ value, min, max, onChange }: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commitDraft = () => {
    if (draft !== null) {
      const parsed = parseInt(draft, 10);
      if (!Number.isNaN(parsed)) {
        onChange(clamp(parsed));
      }
      setDraft(null);
    }
  };

  return (
    <div className="stepper">
      <input
        className="stepper__input"
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDraft();
          if (e.key === 'ArrowUp') onChange(clamp(value + 1));
          if (e.key === 'ArrowDown') onChange(clamp(value - 1));
        }}
      />
      <div className="stepper__arrows">
        <button
          type="button"
          className="stepper__arrow stepper__arrow--up"
          aria-label="Increase"
          onClick={() => onChange(clamp(value + 1))}
        />
        <button
          type="button"
          className="stepper__arrow stepper__arrow--down"
          aria-label="Decrease"
          onClick={() => onChange(clamp(value - 1))}
        />
      </div>
    </div>
  );
}
