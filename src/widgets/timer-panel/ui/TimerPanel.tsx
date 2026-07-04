import { timerStore, useTimer } from '@/entities/timer';
import { IconButton } from '@/shared/ui/IconButton';
import timeBg from '@/shared/assets/elements/time-background.png';
import startBtn from '@/shared/assets/elements/start-timer-button.png';
import pauseBtn from '@/shared/assets/elements/pause-timer-button.png';
import restartBtn from '@/shared/assets/elements/restart-timer-button.png';

function formatTime(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function TimerPanel() {
  const { status, timeLeft } = useTimer();
  const isRunning = status === 'running';

  return (
    <div className="timer-row">
      <IconButton
        icon={restartBtn}
        alt="Reset"
        className="timer-row__side-btn"
        onClick={timerStore.reset}
      />
      <div className="timer">
        <img className="timer__bg" src={timeBg} alt="" />
        <span className="timer__text">{formatTime(timeLeft)}</span>
      </div>
      <IconButton
        icon={isRunning ? pauseBtn : startBtn}
        alt={isRunning ? 'Pause' : 'Start'}
        className="timer-row__side-btn"
        onClick={isRunning ? timerStore.pause : timerStore.start}
      />
    </div>
  );
}
