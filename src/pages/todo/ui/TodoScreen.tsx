import { useState } from 'react';
import { todoStore, useTodos } from '@/entities/todo';
import { t, useLang } from '@/shared/lib/i18n';
import { Titlebar } from '@/widgets/titlebar';
import { IconButton } from '@/shared/ui/IconButton';
import playerBg from '@/shared/assets/player/player-screen-background.png';
import todoHeader from '@/shared/assets/todo/header.png';
import checkIcon from '@/shared/assets/todo/check.png';
import pawIcon from '@/shared/assets/todo/paw-checkbox.png';
import backBtn from '@/shared/assets/player/back-button.png';
import trashBtn from '@/shared/assets/todo/trash-light.png';

type TodoScreenProps = {
  onBack: () => void;
};

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function TaskText({ id, text }: { id: string; text: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        className="todo__text todo__text--edit"
        value={text}
        maxLength={120}
        rows={1}
        autoFocus
        ref={(el) => {
          if (el) autoGrow(el);
        }}
        onChange={(e) => {
          todoStore.updateTask(id, e.target.value);
          autoGrow(e.target);
        }}
        onBlur={(e) => {
          if (!e.target.value.trim()) todoStore.removeTask(id);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <div
      className="todo__text todo__text--view"
      onClick={() => setEditing(true)}
    >
      {text}
    </div>
  );
}

export function TodoScreen({ onBack }: TodoScreenProps) {
  const { tasks } = useTodos();
  const [draft, setDraft] = useState('');
  useLang();

  const remaining = tasks.filter((t) => !t.done).length;
  const hasDone = tasks.some((t) => t.done);

  const commitDraft = () => {
    if (draft.trim()) {
      todoStore.addTask(draft);
      setDraft('');
    }
  };

  return (
    <div className="screen">
      <img className="screen__bg" src={playerBg} alt="" />
      <Titlebar />
      <img className="player__header" src={todoHeader} alt="" />
      <IconButton
        icon={backBtn}
        alt="Back"
        className="player__back"
        onClick={onBack}
      />
      <div className="todo__list">
        {tasks.length > 0 && (
          <div className="todo__footer">
            <span>{remaining} {t('left')}</span>
            {hasDone && (
              <button
                type="button"
                className="todo__clear"
                onClick={() => todoStore.clearCompleted()}
              >
                {t('clearDone')}
              </button>
            )}
          </div>
        )}
        <div className="todo__row todo__row--new">
          <div className="todo__checkbox todo__checkbox--ghost">
            <img className="todo__paw-icon" src={pawIcon} alt="" />
          </div>
          <div className="todo__plate">
            <input
              className="todo__text"
              placeholder={t('newTask')}
              value={draft}
              maxLength={120}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDraft();
                if (e.key === 'Escape') setDraft('');
              }}
            />
          </div>
        </div>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={task.done ? 'todo__row todo__row--done' : 'todo__row'}
          >
            <button
              type="button"
              className="todo__checkbox"
              aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
              onClick={() => todoStore.toggleTask(task.id)}
            >
              <img
                className={task.done ? 'todo__check-icon' : 'todo__paw-icon'}
                src={task.done ? checkIcon : pawIcon}
                alt=""
              />
            </button>
            <div className="todo__plate">
              <TaskText id={task.id} text={task.text} />
            </div>
            <IconButton
              icon={trashBtn}
              alt="Delete task"
              className="todo__delete"
              onClick={() => todoStore.removeTask(task.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
