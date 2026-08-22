import { useEffect, useRef, useState } from 'react';
import { playerStore, readSpectrum, usePlayer } from '@/entities/player';
import { Titlebar } from '@/widgets/titlebar';
import { IconButton } from '@/shared/ui/IconButton';
import playerBg from '@/shared/assets/player/music-screen-background.png';
import musicIcon from '@/shared/assets/player/music-icon.png';
import backBtn from '@/shared/assets/player/back-button.png';
import folderBtn from '@/shared/assets/player/folder-button.png';
import prevBtn from '@/shared/assets/player/prev-button.png';
import nextBtn from '@/shared/assets/player/next-button.png';
import playBtn from '@/shared/assets/player/player-play-button.png';
import pauseBtn from '@/shared/assets/player/player-pause-button.png';
import volumeBtn from '@/shared/assets/player/volume-button.png';
import volumeSliderBg from '@/shared/assets/player/volume-slider.png';
import volumeTrackEmpty from '@/shared/assets/player/volume-track-empty.png';
import volumeTrackFilled from '@/shared/assets/player/volume-track-filled.png';
import volumeThumb from '@/shared/assets/player/volume-thumb.png';
import equalizerBg from '@/shared/assets/player/equalizer-bg.png';
import timelineEmpty from '@/shared/assets/player/timeline-empty.png';
import timelineFilled from '@/shared/assets/player/timeline-filled.png';
import pawThumb from '@/shared/assets/player/paw-thumb.png';
import trackPlayBtn from '@/shared/assets/player/track-play-button.png';
import trackPauseBtn from '@/shared/assets/player/track-pause-button.png';
import trackDeleteBtn from '@/shared/assets/todo/trash-light.png';
import './PlayerScreen.css';

const MARQUEE_PIXELS_PER_SECOND = 15;
const MARQUEE_TRAVEL_RATIO = 0.76;

const EQ_WIDTH = 175;
const EQ_HEIGHT = 36;
const EQ_SEGMENT = 3;
const EQ_GAP = 2;
const EQ_PEAK_HOLD = 500;
const EQ_PEAK_FALL = 0.00045;
const EQ_BARS = [
  { x: 1, w: 17 },
  { x: 19, w: 17 },
  { x: 37, w: 17 },
  { x: 55, w: 17 },
  { x: 73, w: 14 },
  { x: 88, w: 14 },
  { x: 103, w: 17 },
  { x: 121, w: 17 },
  { x: 139, w: 17 },
  { x: 157, w: 17 },
];
const EQ_RAMP = [
  { at: 0, rgb: [198, 132, 118] },
  { at: 0.4, rgb: [225, 167, 150] },
  { at: 0.72, rgb: [242, 210, 191] },
  { at: 1, rgb: [250, 233, 216] },
];
const EQ_PEAK_COLOR = 'rgb(255, 247, 238)';

function rampColor(position: number) {
  let from = EQ_RAMP[0];
  let to = EQ_RAMP[EQ_RAMP.length - 1];
  for (let i = 0; i < EQ_RAMP.length - 1; i += 1) {
    if (position >= EQ_RAMP[i].at && position <= EQ_RAMP[i + 1].at) {
      from = EQ_RAMP[i];
      to = EQ_RAMP[i + 1];
      break;
    }
  }
  const span = to.at - from.at || 1;
  const t = Math.min(1, Math.max(0, (position - from.at) / span));
  const channel = (i: number) =>
    Math.round(from.rgb[i] + (to.rgb[i] - from.rgb[i]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function Equalizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const count = EQ_BARS.length;
    const levels = new Array<number>(count).fill(0);
    const shown = new Array<number>(count).fill(0);
    const peaks = new Array<number>(count).fill(0);
    const peakAt = new Array<number>(count).fill(0);
    const baseline = EQ_HEIGHT - 1;
    const pitch = EQ_SEGMENT + EQ_GAP;
    const slots = Math.floor((baseline - 1) / pitch);
    let raf = 0;

    const draw = (now: number) => {
      if (active && !readSpectrum(count, levels)) {
        for (let i = 0; i < count; i += 1) {
          const wave =
            Math.sin(now / 340 + i * 0.8) * 0.3 +
            Math.sin(now / 150 + i * 2.1) * 0.18;
          levels[i] = 0.42 + wave;
        }
      }
      if (!active) levels.fill(0);

      let moving = false;
      ctx.clearRect(0, 0, EQ_WIDTH, EQ_HEIGHT);

      for (let i = 0; i < count; i += 1) {
        const target = Math.min(1, Math.max(0, levels[i]));
        const rising = target > shown[i];
        if (Math.abs(target - shown[i]) > 0.004) moving = true;
        shown[i] += (target - shown[i]) * (rising ? 0.5 : 0.11);

        if (shown[i] >= peaks[i]) {
          peaks[i] = shown[i];
          peakAt[i] = now;
        } else if (now - peakAt[i] > EQ_PEAK_HOLD) {
          peaks[i] = Math.max(0, peaks[i] - (now - peakAt[i]) * EQ_PEAK_FALL);
          moving = true;
        }

        const bar = EQ_BARS[i];
        const lit = Math.max(1, Math.round(shown[i] * slots));
        for (let s = 0; s < lit; s += 1) {
          const top = baseline - (s + 1) * pitch + EQ_GAP;
          ctx.fillStyle = rampColor(slots > 1 ? s / (slots - 1) : 0);
          ctx.fillRect(bar.x, top, bar.w, EQ_SEGMENT);
        }

        const peakSlot = Math.round(peaks[i] * slots);
        if (peakSlot > lit) {
          const top = baseline - peakSlot * pitch + EQ_GAP;
          ctx.fillStyle = EQ_PEAK_COLOR;
          ctx.fillRect(bar.x, top, bar.w, EQ_SEGMENT);
        }
      }

      if (active || moving) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="player__eq-canvas"
      width={EQ_WIDTH}
      height={EQ_HEIGHT}
    />
  );
}

function TrackName({ name, onClick }: { name: string; onClick: () => void }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [marquee, setMarquee] = useState<{ shift: number; duration: number } | null>(null);

  return (
    <div
      className={
        marquee
          ? 'player__track-name player__track-name--marquee'
          : 'player__track-name'
      }
      style={
        marquee
          ? ({
              '--marquee-shift': `${-marquee.shift}px`,
              '--marquee-duration': `${marquee.duration}s`,
            } as React.CSSProperties)
          : undefined
      }
      onClick={onClick}
      onMouseEnter={(e) => {
        const container = e.currentTarget;
        const span = spanRef.current;
        if (!span) return;
        const overflow = span.scrollWidth - container.clientWidth;
        if (overflow > 2) {
          const shift = overflow + 8;
          const travel = shift / MARQUEE_PIXELS_PER_SECOND / MARQUEE_TRAVEL_RATIO;
          setMarquee({ shift, duration: Math.max(travel, 2.5) });
        }
      }}
      onMouseLeave={() => {
        const span = spanRef.current;
        if (span && marquee) {
          const current = getComputedStyle(span).transform;
          span.style.transition = 'none';
          span.style.transform = current === 'none' ? 'translateX(0)' : current;
          requestAnimationFrame(() => {
            span.style.transition = 'transform 0.5s ease-out';
            span.style.transform = 'translateX(0)';
          });
          window.setTimeout(() => {
            span.style.transition = '';
            span.style.transform = '';
          }, 550);
        }
        setMarquee(null);
      }}
    >
      <span ref={spanRef}>{name}</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

type PlayerScreenProps = {
  onBack: () => void;
};

export function PlayerScreen({ onBack }: PlayerScreenProps) {
  const { tracks, currentIndex, isPlaying, currentTime, duration, volume } =
    usePlayer();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [volumeCenter, setVolumeCenter] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const volumeWrapRef = useRef<HTMLSpanElement>(null);

  const measureVolumeCenter = () => {
    const wrap = volumeWrapRef.current;
    const screen = wrap?.closest('.screen');
    if (wrap && screen) {
      const wrapRect = wrap.getBoundingClientRect();
      const screenRect = screen.getBoundingClientRect();
      setVolumeCenter(wrapRect.left + wrapRect.width / 2 - screenRect.left);
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  const seekFromPointer = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || duration === 0) return;
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    playerStore.seek(fraction * duration);
  };

  const volumeFromPointer = (clientY: number) => {
    const rect = volumeTrackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const fraction = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    playerStore.setVolume(fraction);
  };

  const holdRef = useRef({ timer: 0, interval: 0, held: false });

  const startHold = (direction: 1 | -1) => {
    holdRef.current.held = false;
    holdRef.current.timer = window.setTimeout(() => {
      holdRef.current.held = true;
      playerStore.scrub(direction * 5);
      holdRef.current.interval = window.setInterval(
        () => playerStore.scrub(direction * 5),
        200,
      );
    }, 400);
  };

  const endHold = () => {
    window.clearTimeout(holdRef.current.timer);
    window.clearInterval(holdRef.current.interval);
  };

  return (
    <div className="screen">
      <img className="screen__bg" src={playerBg} alt="" />
      <Titlebar />
      <img className="player__music-icon" src={musicIcon} alt="" />
      <IconButton
        icon={backBtn}
        alt="Back"
        className="player__back"
        onClick={onBack}
      />
      <div className="player__controls">
        <IconButton
          icon={folderBtn}
          alt="Add tracks"
          className="player__folder"
          onClick={() => fileInputRef.current?.click()}
        />
        <span
          onMouseDown={() => startHold(-1)}
          onMouseUp={endHold}
          onMouseLeave={endHold}
        >
          <IconButton
            icon={prevBtn}
            alt="Previous"
            className="player__nav-btn"
            onClick={() => {
              if (!holdRef.current.held) playerStore.prev();
            }}
          />
        </span>
        <IconButton
          icon={isPlaying ? pauseBtn : playBtn}
          alt={isPlaying ? 'Pause' : 'Play'}
          className="player__play"
          onClick={() => playerStore.toggle()}
        />
        <span
          onMouseDown={() => startHold(1)}
          onMouseUp={endHold}
          onMouseLeave={endHold}
        >
          <IconButton
            icon={nextBtn}
            alt="Next"
            className="player__nav-btn"
            onClick={() => {
              if (!holdRef.current.held) playerStore.next();
            }}
          />
        </span>
        <span
          ref={volumeWrapRef}
          onWheel={(e) =>
            playerStore.setVolume(volume + (e.deltaY < 0 ? 0.05 : -0.05))
          }
        >
          <IconButton
            icon={volumeBtn}
            alt="Volume"
            className="player__volume-btn"
            onClick={() => {
              measureVolumeCenter();
              setVolumeOpen((open) => !open);
            }}
          />
        </span>
      </div>
      {volumeOpen && (
        <div
          className="player__volume-popup"
          style={
            volumeCenter !== null
              ? { left: volumeCenter, transform: 'translateX(-50%)' }
              : undefined
          }
          onWheel={(e) =>
            playerStore.setVolume(volume + (e.deltaY < 0 ? 0.05 : -0.05))
          }
          onMouseDown={(e) => {
            volumeFromPointer(e.clientY);
            const move = (ev: MouseEvent) => volumeFromPointer(ev.clientY);
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
        >
          <img className="player__volume-popup-bg" src={volumeSliderBg} alt="" />
          <div ref={volumeTrackRef} className="player__volume-track">
            <img className="player__volume-empty" src={volumeTrackEmpty} alt="" />
            <div
              className="player__volume-filled-wrap"
              style={{ height: `${volume * 100}%` }}
            >
              <img className="player__volume-filled" src={volumeTrackFilled} alt="" />
            </div>
            <img
              className="player__volume-thumb"
              src={volumeThumb}
              alt=""
              style={{ bottom: `calc(${volume * 100}% - 8px)` }}
            />
          </div>
        </div>
      )}
      <div className="player__equalizer">
        <img className="player__eq-bg" src={equalizerBg} alt="" />
        <Equalizer active={isPlaying} />
      </div>
      <div className="player__timeline-row">
        <span className="player__time">{formatTime(currentTime)}</span>
        <div
          ref={timelineRef}
          className="player__timeline"
          onMouseDown={(e) => {
            seekFromPointer(e.clientX);
            const move = (ev: MouseEvent) => seekFromPointer(ev.clientX);
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
        >
          <img className="player__timeline-empty" src={timelineEmpty} alt="" />
          <div
            className="player__timeline-filled-wrap"
            style={{ width: `${progress * 100}%` }}
          >
            <img className="player__timeline-filled" src={timelineFilled} alt="" />
          </div>
          <img
            className="player__paw"
            src={pawThumb}
            alt=""
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
      <div className="player__playlist">
        {tracks.map((track, index) => {
          const isCurrent = index === currentIndex;
          const isTrackPlaying = isCurrent && isPlaying;
          const handleTrackClick = () => {
            if (isCurrent) {
              playerStore.toggle();
            } else {
              playerStore.play(index);
            }
          };
          return (
            <div
              key={track.url}
              className={
                isCurrent
                  ? 'player__track player__track--active'
                  : 'player__track'
              }
            >
              <IconButton
                icon={isTrackPlaying ? trackPauseBtn : trackPlayBtn}
                alt={isTrackPlaying ? 'Pause track' : 'Play track'}
                className="player__track-play"
                onClick={handleTrackClick}
              />
              <TrackName name={track.name} onClick={handleTrackClick} />
              <IconButton
                icon={trackDeleteBtn}
                alt="Delete track"
                className="player__track-delete"
                onClick={() => playerStore.removeTrack(index)}
              />
            </div>
          );
        })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) {
            playerStore.addFiles(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
