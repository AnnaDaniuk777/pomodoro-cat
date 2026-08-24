import { useCallback, useEffect, useRef, useState } from 'react';
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
import catPoofSheet from '@/shared/assets/sprites/cat-poof.png';
import catPoofData from '@/shared/assets/sprites/cat-poof.json';
import poofSheet from '@/shared/assets/sprites/poof.png';
import poofData from '@/shared/assets/sprites/poof.json';
import { SpriteBurst } from './SpriteBurst';
import './CatStage.css';

const BOWL_SCALE = 2;
const BALL_SCALE = 2.4;
const POOF_SCALE = 2;
const TREAT_DURATION = 3600;
const POOF_LEAD = 100;
const CAT_RETURN_DELAY = 600;

type Treat = 'none' | 'bowl' | 'ball';
type PoofPhase = 'none' | 'vanish' | 'gone' | 'return';

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

  const [treat, setTreat] = useState<Treat>('none');
  const [poof, setPoof] = useState<PoofPhase>('none');
  const [catBack, setCatBack] = useState(true);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const startTreat = (kind: Exclude<Treat, 'none'>) => {
    if (animation !== 'idle' || poof !== 'none' || treat !== 'none') return;
    setPoof('vanish');
    setCatBack(false);
    setTreat(kind);
    timers.current.push(
      window.setTimeout(() => setPoof('return'), TREAT_DURATION - POOF_LEAD),
      window.setTimeout(
        () => setCatBack(true),
        TREAT_DURATION - POOF_LEAD + CAT_RETURN_DELAY,
      ),
    );
  };

  const finishVanish = useCallback(() => setPoof('gone'), []);
  const finishReturn = useCallback(() => {
    setPoof('none');
    setCatBack(true);
  }, []);
  const finishTreat = useCallback(() => setTreat('none'), []);

  const toggleTimer = () => {
    if (status === 'running') {
      timerStore.pause();
    } else {
      timerStore.start();
    }
  };

  return (
    <div className="cat-stage">
      {catBack && (
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
      )}
      {poof === 'vanish' && (
        <SpriteBurst
          sheet={catPoofSheet}
          data={catPoofData}
          scale={POOF_SCALE}
          className="cat-stage__poof"
          onDone={finishVanish}
        />
      )}
      {poof === 'return' && (
        <SpriteBurst
          sheet={poofSheet}
          data={poofData}
          scale={POOF_SCALE}
          className="cat-stage__poof"
          onDone={finishReturn}
        />
      )}
      {treat === 'bowl' ? (
        <SpriteBurst
          sheet={bowlEatSheet}
          data={bowlEatData}
          scale={BOWL_SCALE}
          className="cat-stage__bowl-anim"
          onDone={finishTreat}
        />
      ) : (
        <IconButton
          icon={bowlIcon}
          ariaLabel="Feed cat"
          className="cat-stage__bowl"
          onClick={() => startTreat('bowl')}
        />
      )}
      {treat === 'ball' ? (
        <SpriteBurst
          sheet={ballPlaySheet}
          data={ballPlayData}
          scale={BALL_SCALE}
          className="cat-stage__ball-anim"
          onDone={finishTreat}
        />
      ) : (
        <IconButton
          icon={ballIcon}
          ariaLabel="Play with cat"
          className="cat-stage__ball"
          onClick={() => startTreat('ball')}
        />
      )}
    </div>
  );
}
