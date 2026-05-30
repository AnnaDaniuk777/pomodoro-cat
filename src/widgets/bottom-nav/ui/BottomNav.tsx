import { IconButton } from '@/shared/ui/IconButton';
import todoBtn from '@/shared/assets/elements/todo-button.png';
import musicBtn from '@/shared/assets/elements/music-button.png';
import settingsBtn from '@/shared/assets/elements/settings-button.png';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <IconButton icon={todoBtn} alt="Tasks" className="bottom-nav__todo" />
      <IconButton icon={musicBtn} alt="Music" className="bottom-nav__music" />
      <IconButton
        icon={settingsBtn}
        alt="Settings"
        className="bottom-nav__settings"
      />
    </nav>
  );
}
