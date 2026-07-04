import { IconButton } from '@/shared/ui/IconButton';
import todoBtn from '@/shared/assets/elements/todo-button.png';
import musicBtn from '@/shared/assets/elements/music-button.png';
import settingsBtn from '@/shared/assets/elements/settings-button.png';
import todoFoliage from '@/shared/assets/elements/todo-foliage.png';
import musicFoliage from '@/shared/assets/elements/music-foliage.png';
import settingsFoliage from '@/shared/assets/elements/settings-foliage.png';

type BottomNavProps = {
  onSettingsClick?: () => void;
};

export function BottomNav({ onSettingsClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__item">
        <IconButton icon={todoBtn} alt="Tasks" className="bottom-nav__btn" />
        <img className="bottom-nav__foliage bottom-nav__foliage--todo" src={todoFoliage} alt="" />
      </div>
      <div className="bottom-nav__item">
        <IconButton icon={musicBtn} alt="Music" className="bottom-nav__btn" />
        <img className="bottom-nav__foliage bottom-nav__foliage--music" src={musicFoliage} alt="" />
      </div>
      <div className="bottom-nav__item">
        <IconButton
          icon={settingsBtn}
          alt="Settings"
          className="bottom-nav__btn"
          onClick={onSettingsClick}
        />
        <img className="bottom-nav__foliage bottom-nav__foliage--settings" src={settingsFoliage} alt="" />
      </div>
    </nav>
  );
}
