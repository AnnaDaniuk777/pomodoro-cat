import { useEffect, useRef, useState } from 'react';
import {
  electronApi,
  type WidgetPlayerState,
} from '@/shared/lib/electron-api';
import { IconButton } from '@/shared/ui/IconButton';
import { useDragHandle } from '@/shared/lib/drag-handle';
import { cssUrl } from '@/shared/lib/css-url';
import panelBg from '@/shared/assets/player-widget/panel.png';
import catImg from '@/shared/assets/player-widget/cat.png';
import volumeSlider from '@/shared/assets/player-widget/volume-slider.png';
import volumeEmpty from '@/shared/assets/player-widget/volume-empty.png';
import volumeFilled from '@/shared/assets/player-widget/volume-filled.png';
import volumeThumb from '@/shared/assets/player-widget/volume-thumb.png';
import volumeBtn from '@/shared/assets/player-widget/volume-button.png';
import playBtn from '@/shared/assets/player-widget/play-button.png';
import pauseBtn from '@/shared/assets/player-widget/pause-button.png';
import prevBtn from '@/shared/assets/player-widget/prev-button.png';
import nextBtn from '@/shared/assets/player-widget/next-button.png';
import folderBtn from '@/shared/assets/player-widget/folder-button.png';
import progressEmpty from '@/shared/assets/player-widget/progress-empty.png';
import progressFilled from '@/shared/assets/player-widget/progress-filled.png';
import pawImg from '@/shared/assets/player-widget/paw.png';
import repeatBtn from '@/shared/assets/player-widget/repeat-button.png';
import repeatOnBtn from '@/shared/assets/player-widget/repeat-button-on.png';
import closeBtn from '@/shared/assets/player-widget/close-button.png';
import restoreBtn from '@/shared/assets/player-widget/restore-button.png';
import './PlayerWidgetScreen.css';

export function PlayerWidgetScreen() {
  const [player, setPlayer] = useState<WidgetPlayerState>({
    hasTrack: false,
    isPlaying: false,
    progress: 0,
    volume: 0.7,
    repeat: false,
  });
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [volumeCenter, setVolumeCenter] = useState(193);
  const timelineRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const volumeWrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    electronApi.onPlayerState(setPlayer);
  }, []);

  useEffect(() => {
    const report = () => {
      const zones = Array.from(
        document.querySelectorAll(
          '.pwidget__panel, .pwidget__volume-popup, .pwidget__cat',
        ),
      ).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: Math.floor(r.left),
          y: Math.floor(r.top),
          w: Math.ceil(r.width),
          h: Math.ceil(r.height),
        };
      });
      electronApi.playerWidgetSetSolidZones(zones);
    };
    report();
    const intervalId = window.setInterval(report, 400);
    const onDown = () => electronApi.playerWidgetSetDragging(true);
    const onUp = () => electronApi.playerWidgetSetDragging(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onUp);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onUp);
      electronApi.playerWidgetSetDragging(false);
    };
  }, []);

  const measureVolumeCenter = () => {
    const wrap = volumeWrapRef.current;
    const container = wrap?.closest('.pwidget');
    if (wrap && container) {
      const wrapRect = wrap.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setVolumeCenter(wrapRect.left + wrapRect.width / 2 - containerRect.left);
    }
  };

  useEffect(() => {
    measureVolumeCenter();
  }, []);

  useEffect(() => {
    if (!volumeOpen) return;
    const closeIfOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const insidePopup = document
        .querySelector('.pwidget__volume-popup')
        ?.contains(target);
      const insideButton = volumeWrapRef.current?.contains(target);
      if (!insidePopup && !insideButton) setVolumeOpen(false);
    };
    const closeOnBlur = () => setVolumeOpen(false);
    window.addEventListener('mousedown', closeIfOutside);
    window.addEventListener('blur', closeOnBlur);
    return () => {
      window.removeEventListener('mousedown', closeIfOutside);
      window.removeEventListener('blur', closeOnBlur);
    };
  }, [volumeOpen]);

  const seekFromPointer = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    electronApi.playerCmd('seek', fraction);
  };

  const volumeFromPointer = (clientY: number) => {
    const rect = volumeTrackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const fraction = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    electronApi.playerCmd('volume', fraction);
  };

  const timelineDrag = useDragHandle(({ clientX }) => seekFromPointer(clientX));
  const volumeDrag = useDragHandle(({ clientY }) => volumeFromPointer(clientY));

  const adjustVolumeByWheel = (deltaY: number) => {
    electronApi.playerCmd(
      'volume',
      Math.min(1, Math.max(0, player.volume + (deltaY < 0 ? 0.05 : -0.05))),
    );
  };

  const holdRef = useRef({ timer: 0, interval: 0, held: false });

  const startHold = (direction: 1 | -1) => {
    holdRef.current.held = false;
    holdRef.current.timer = window.setTimeout(() => {
      holdRef.current.held = true;
      electronApi.playerCmd('scrub', direction * 5);
      holdRef.current.interval = window.setInterval(
        () => electronApi.playerCmd('scrub', direction * 5),
        200,
      );
    }, 400);
  };

  const endHold = () => {
    window.clearTimeout(holdRef.current.timer);
    window.clearInterval(holdRef.current.interval);
  };

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (
      (e.target as HTMLElement).closest(
        'button, .pwidget__timeline, .pwidget__volume-popup',
      )
    ) {
      return;
    }
    const grabX = e.screenX - window.screenX;
    const grabY = e.screenY - window.screenY;
    const move = (ev: MouseEvent) => {
      electronApi.playerWidgetSetPosition(ev.screenX - grabX, ev.screenY - grabY);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div className="pwidget" onMouseDown={startDrag}>
      <img
        className={
          volumeOpen ? 'pwidget__cat pwidget__cat--on-slider' : 'pwidget__cat'
        }
        style={{ left: volumeCenter }}
        src={catImg}
        alt=""
      />
      <div
        className="pwidget__panel"
        style={{ backgroundImage: cssUrl(panelBg) }}
      >
        <div className="pwidget__window-btns">
          <IconButton
            icon={restoreBtn}
            alt="Open Catodoro"
            className="pwidget__window-btn"
            onClick={() => electronApi.widgetRestore()}
          />
          <IconButton
            icon={closeBtn}
            alt="Stop and hide"
            className="pwidget__window-btn"
            onClick={() => {
              if (player.isPlaying) electronApi.playerCmd('toggle');
              electronApi.playerWidgetHide();
            }}
          />
        </div>
        <div className="pwidget__controls">
          <span
            onMouseDown={() => startHold(-1)}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            <IconButton
              icon={prevBtn}
              alt="Previous"
              className="pwidget__nav"
              onClick={() => {
                if (!holdRef.current.held) electronApi.playerCmd('prev');
              }}
            />
          </span>
          <IconButton
            icon={player.isPlaying ? pauseBtn : playBtn}
            alt={player.isPlaying ? 'Pause' : 'Play'}
            className="pwidget__play"
            onClick={() => electronApi.playerCmd('toggle')}
          />
          <span
            onMouseDown={() => startHold(1)}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            <IconButton
              icon={nextBtn}
              alt="Next"
              className="pwidget__nav"
              onClick={() => {
                if (!holdRef.current.held) electronApi.playerCmd('next');
              }}
            />
          </span>
          <span ref={volumeWrapRef} onWheel={(e) => adjustVolumeByWheel(e.deltaY)}>
            <IconButton
              icon={volumeBtn}
              alt="Volume"
              className="pwidget__volume-btn"
              onClick={() => {
                measureVolumeCenter();
                setVolumeOpen((open) => !open);
              }}
            />
          </span>
          <IconButton
            icon={folderBtn}
            alt="Add tracks"
            className="pwidget__folder"
            onClick={() => electronApi.openAddFilesDialog()}
          />
        </div>
        <div
          ref={timelineRef}
          className="pwidget__timeline"
          {...timelineDrag}
        >
          <img className="pwidget__timeline-empty" src={progressEmpty} alt="" />
          <div
            className="pwidget__timeline-filled-wrap"
            style={{ '--progress': player.progress } as React.CSSProperties}
          >
            <img className="pwidget__timeline-filled" src={progressFilled} alt="" />
          </div>
          <img
            className="pwidget__paw"
            src={pawImg}
            alt=""
            style={{ left: `${player.progress * 100}%` }}
          />
        </div>
        <IconButton
          icon={player.repeat ? repeatOnBtn : repeatBtn}
          alt="Repeat playlist"
          className="pwidget__repeat"
          onClick={() => electronApi.playerCmd('repeat')}
        />
      </div>
      {volumeOpen && (
        <div
          className="pwidget__volume-popup"
          style={{ left: volumeCenter }}
          onWheel={(e) => adjustVolumeByWheel(e.deltaY)}
          {...volumeDrag}
        >
          <img className="pwidget__volume-popup-bg" src={volumeSlider} alt="" />
          <div ref={volumeTrackRef} className="pwidget__volume-track">
            <img className="pwidget__volume-empty" src={volumeEmpty} alt="" />
            <div
              className="pwidget__volume-filled-wrap"
              style={{ height: `${player.volume * 100}%` }}
            >
              <img className="pwidget__volume-filled" src={volumeFilled} alt="" />
            </div>
            <img
              className="pwidget__volume-thumb"
              src={volumeThumb}
              alt=""
              style={{ bottom: `calc(${player.volume * 100}% - 7px)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
