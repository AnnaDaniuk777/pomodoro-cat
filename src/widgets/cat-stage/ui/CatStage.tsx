import { Cat, type CatAnimationName } from '@/entities/cat';
import {
  timerStore,
  useTimer,
  type TimerMode,
  type TimerStatus,
} from '@/entities/timer';
import { IconButton } from '@/shared/ui/IconButton';
import bowlIcon from '@/shared/assets/elements/bowl-icon.png';
import ballIcon from '@/shared/assets/elements/ball-icon.png';

function resolveAnimation(
  status: TimerStatus,
  mode: TimerMode,
): CatAnimationName {
  if (status !== 'running') return 'idle';
  return mode === 'break' ? 'chill' : 'play';
}

export function CatStage() {
  const { status, mode } = useTimer();

  const toggleTimer = () => {
    if (status === 'running') {
      timerStore.pause();
    } else {
      timerStore.start();
    }
  };

  return (
    <div className="cat-stage">
      <div
        className="cat-stage__cat"
        role="button"
        aria-label={status === 'running' ? 'Pause timer' : 'Start timer'}
        onClick={toggleTimer}
      >
        <Cat animation={resolveAnimation(status, mode)} />
      </div>
      <IconButton
        icon={bowlIcon}
        ariaLabel="Feed cat"
        className="cat-stage__bowl"
      />
      <IconButton
        icon={ballIcon}
        ariaLabel="Play with cat"
        className="cat-stage__ball"
      />
    </div>
  );
}
