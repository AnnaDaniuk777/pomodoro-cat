import { Titlebar } from '@/widgets/titlebar';
import { CatStage } from '@/widgets/cat-stage';
import { TimerPanel } from '@/widgets/timer-panel';
import { BottomNav } from '@/widgets/bottom-nav';
import mainBg from '@/shared/assets/elements/main-screen-background.png';

export function MainScreen() {
  return (
    <div className="screen">
      <img className="screen__bg" src={mainBg} alt="" />
      <Titlebar />
      <CatStage />
      <TimerPanel />
      <BottomNav />
    </div>
  );
}
