import { IconButton } from '@/shared/ui/IconButton';
import timeBg from '@/shared/assets/elements/time-background.png';
import startBtn from '@/shared/assets/elements/start-timer-button.png';
import restartBtn from '@/shared/assets/elements/restart-timer-button.png';

// TODO(issue #1): wire to entities/timer store when implemented.
//   Display will read `timeLeft` from useTimerStore(); buttons will
//   dispatch start/pause/reset actions.

export function TimerPanel() {
  return (
    <>
      <div className="timer">
        <img className="timer__bg" src={timeBg} alt="" />
        <span className="timer__text">25:00</span>
      </div>
      <div className="timer-controls">
        <IconButton
          icon={startBtn}
          alt="Start"
          className="timer-controls__btn"
        />
        <IconButton
          icon={restartBtn}
          alt="Reset"
          className="timer-controls__btn"
        />
      </div>
    </>
  );
}
