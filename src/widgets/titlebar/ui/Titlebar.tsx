import { IconButton } from '@/shared/ui/IconButton';
import { electronApi } from '@/shared/lib/electron-api';
import closeBtn from '@/shared/assets/elements/close-button.png';
import minimizeBtn from '@/shared/assets/elements/minimize-button.png';

export function Titlebar() {
  return (
    <div className="titlebar">
      <IconButton
        icon={minimizeBtn}
        alt="Minimize"
        className="titlebar__btn"
        onClick={electronApi.minimize}
      />
      <IconButton
        icon={closeBtn}
        alt="Close"
        className="titlebar__btn"
        onClick={electronApi.close}
      />
    </div>
  );
}
