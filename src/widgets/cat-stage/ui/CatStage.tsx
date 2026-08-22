import { useCallback, useState } from 'react';
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
import bowlEatSheet from '@/shared/assets/elements/bowl-eat.png';
import bowlEatData from '@/shared/assets/elements/bowl-eat.json';
import ballPlaySheet from '@/shared/assets/elements/ball-play.png';
import ballPlayData from '@/shared/assets/elements/ball-play.json';
import { SpriteBurst } from './SpriteBurst';
import './CatStage.css';

const BOWL_SCALE = 2;
const BALL_SCALE = 2.4;

function resolveAnimation(
  status: TimerStatus,
  mode: TimerMode,
): CatAnimationName {
  if (status !== 'running') return 'idle';
  return mode === 'break' ? 'chill' : 'play';
}

export function CatStage() {
  const status = useTimer((state) => state.status);
  const mode = useTimer((state) => state.mode);
  const animation = resolveAnimation(status, mode);
  const [bowlBusy, setBowlBusy] = useState(false);
  const [ballBusy, setBallBusy] = useState(false);

  const working = status === 'running' && mode === 'work';

  const toggleTimer = () => {
    if (status === 'running') {
      timerStore.pause();
    } else {
      timerStore.start();
    }
  };

  const stopBowl = useCallback(() => setBowlBusy(false), []);
  const stopBall = useCallback(() => setBallBusy(false), []);

  return (
    <div className="cat-stage">
      <div
        className={
          animation === 'chill'
            ? 'cat-stage__cat cat-stage__cat--chill'
            : 'cat-stage__cat'
        }
        role="button"
        aria-label={status === 'running' ? 'Pause timer' : 'Start timer'}
        onClick={toggleTimer}
      >
        <Cat animation={animation} />
      </div>
      {bowlBusy ? (
        <SpriteBurst
          sheet={bowlEatSheet}
          data={bowlEatData}
          scale={BOWL_SCALE}
          className="cat-stage__bowl-anim"
          onDone={stopBowl}
        />
      ) : (
        <IconButton
          icon={bowlIcon}
          ariaLabel="Feed cat"
          className="cat-stage__bowl"
          onClick={working ? undefined : () => setBowlBusy(true)}
        />
      )}
      {ballBusy ? (
        <SpriteBurst
          sheet={ballPlaySheet}
          data={ballPlayData}
          scale={BALL_SCALE}
          className="cat-stage__ball-anim"
          onDone={stopBall}
        />
      ) : (
        <IconButton
          icon={ballIcon}
          ariaLabel="Play with cat"
          className="cat-stage__ball"
          onClick={working ? undefined : () => setBallBusy(true)}
        />
      )}
    </div>
  );
}
