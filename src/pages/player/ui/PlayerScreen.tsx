import { useMemo, useRef, useState } from 'react';
import { extractFrames, useSpriteAnimation } from '@/entities/cat';
import { playerStore, usePlayer } from '@/entities/player';
import { Titlebar } from '@/widgets/titlebar';
import { IconButton } from '@/shared/ui/IconButton';
import playerBg from '@/shared/assets/player/player-screen-background.png';
import headerImg from '@/shared/assets/player/player-header.png';
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
import equalizerStatic from '@/shared/assets/player/equalizer-static.png';
import equalizerSheet from '@/shared/assets/player/equalizer.png';
import equalizerData from '@/shared/assets/player/equalizer.json';
import timelineEmpty from '@/shared/assets/player/timeline-empty.png';
import timelineFilled from '@/shared/assets/player/timeline-filled.png';
import pawThumb from '@/shared/assets/player/paw-thumb.png';
import trackPlayBtn from '@/shared/assets/player/track-play-button.png';
import trackPauseBtn from '@/shared/assets/player/track-pause-button.png';
import trackDeleteBtn from '@/shared/assets/player/track-delete-button.png';

const EQ_SCALE = 1.6;

function EqualizerAnimation() {
  const frames = useMemo(() => extractFrames(equalizerData), []);
  const current = useSpriteAnimation({ frames, loop: true });
  const { x, w, h } = { x: current.frame.x, w: current.frame.w, h: current.frame.h };
  const { w: sheetW, h: sheetH } = equalizerData.meta.size;

  return (
    <div
      className="player__eq-anim"
      style={{
        width: w * EQ_SCALE,
        height: h * EQ_SCALE,
        backgroundImage: `url(${equalizerSheet})`,
        backgroundPosition: `-${x * EQ_SCALE}px 0px`,
        backgroundSize: `${sheetW * EQ_SCALE}px ${sheetH * EQ_SCALE}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
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
        const overflow = span.scrollWidth - container.clientWidth + 8;
        if (overflow > 0) {
          setMarquee({ shift: overflow, duration: overflow / 30 });
        }
      }}
      onMouseLeave={() => setMarquee(null)}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="screen">
      <img className="screen__bg" src={playerBg} alt="" />
      <Titlebar />
      <img className="player__header" src={headerImg} alt="" />
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
        <IconButton
          icon={prevBtn}
          alt="Previous"
          className="player__nav-btn"
          onClick={() => playerStore.prev()}
        />
        <IconButton
          icon={isPlaying ? pauseBtn : playBtn}
          alt={isPlaying ? 'Pause' : 'Play'}
          className="player__play"
          onClick={() => playerStore.toggle()}
        />
        <IconButton
          icon={nextBtn}
          alt="Next"
          className="player__nav-btn"
          onClick={() => playerStore.next()}
        />
        <span
          onWheel={(e) =>
            playerStore.setVolume(volume + (e.deltaY < 0 ? 0.05 : -0.05))
          }
        >
          <IconButton
            icon={volumeBtn}
            alt="Volume"
            className="player__volume-btn"
            onClick={() => setVolumeOpen((open) => !open)}
          />
        </span>
      </div>
      {volumeOpen && (
        <div
          className="player__volume-popup"
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
        {isPlaying ? (
          <EqualizerAnimation />
        ) : (
          <img className="player__eq-static" src={equalizerStatic} alt="" />
        )}
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
