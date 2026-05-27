import { Cat } from './components/Cat';
import { IconButton } from './components/IconButton';
import mainBg from './assets/elements/main-screen-background.png';
import timeBg from './assets/elements/time-background.png';
import startBtn from './assets/elements/start-timer-button.png';
import restartBtn from './assets/elements/restart-timer-button.png';
import todoBtn from './assets/elements/todo-button.png';
import musicBtn from './assets/elements/music-button.png';
import settingsBtn from './assets/elements/settings-button.png';
import closeBtn from './assets/elements/close-button.png';
import minimizeBtn from './assets/elements/minimize-button.png';
import bowlIcon from './assets/elements/bowl-icon.png';
import ballIcon from './assets/elements/ball-icon.png';
import './App.css';

function App() {
  const minimize = () => window.electronAPI?.minimize();
  const close = () => window.electronAPI?.close();

  return (
    <div className="screen">
      <img className="screen__bg" src={mainBg} alt="" />

      <div className="titlebar">
        <IconButton
          icon={minimizeBtn}
          alt="Minimize"
          className="titlebar__btn"
          onClick={minimize}
        />
        <IconButton
          icon={closeBtn}
          alt="Close"
          className="titlebar__btn"
          onClick={close}
        />
      </div>

      <div className="cat-stage">
        <Cat />
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

      <nav className="bottom-nav">
        <IconButton icon={todoBtn} alt="Tasks" className="bottom-nav__todo" />
        <IconButton icon={musicBtn} alt="Music" className="bottom-nav__music" />
        <IconButton
          icon={settingsBtn}
          alt="Settings"
          className="bottom-nav__settings"
        />
      </nav>
    </div>
  );
}

export default App;
