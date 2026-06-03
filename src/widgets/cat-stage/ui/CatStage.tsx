import { Cat } from '@/entities/cat';
import { IconButton } from '@/shared/ui/IconButton';
import bowlIcon from '@/shared/assets/elements/bowl-icon.png';
import ballIcon from '@/shared/assets/elements/ball-icon.png';

export function CatStage() {
  return (
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
  );
}
