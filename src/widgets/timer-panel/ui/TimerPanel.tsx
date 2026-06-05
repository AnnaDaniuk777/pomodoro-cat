import { IconButton } from '@/shared/ui/IconButton';
import timeBg from '@/shared/assets/elements/time-background.png';
import startBtn from '@/shared/assets/elements/start-timer-button.png';
import restartBtn from '@/shared/assets/elements/restart-timer-button.png';

// TODO(issue #1): wire to entities/timer store when implemented.

export function TimerPanel() {
  return (
    <div className="timer-row">
      <IconButton icon={restartBtn} alt="Reset" className="timer-row__side-btn" />
      <div className="timer">
        <img className="timer__bg" src={timeBg} alt="" />
        <span className="timer__text">25:00</span>
      </div>
      <IconButton icon={startBtn} alt="Start" className="timer-row__side-btn" />
    </div>
  );
}
