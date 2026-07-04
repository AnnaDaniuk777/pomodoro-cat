import { useState } from 'react';
import { Titlebar } from '@/widgets/titlebar';
import { CatStage } from '@/widgets/cat-stage';
import { TimerPanel } from '@/widgets/timer-panel';
import { BottomNav } from '@/widgets/bottom-nav';
import { SettingsSheet } from '@/widgets/settings-sheet';
import mainBg from '@/shared/assets/elements/main-screen-background.png';

export function MainScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="screen">
      <img className="screen__bg" src={mainBg} alt="" />
      <Titlebar />
      <CatStage />
      <TimerPanel />
      <BottomNav onSettingsClick={() => setSettingsOpen(true)} />
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
