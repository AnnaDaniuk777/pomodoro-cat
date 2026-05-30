# 🐱 Pomodoro Cat

Кроссплатформенное desktop-приложение для управления временем по методике Pomodoro
с анимированным котиком-компаньоном. Pixel art стиль, гейм-механики (покорми/поиграй
с котом во время перерыва), без GIF — анимации, построены на спрайт-листах из Aseprite.

> **Статус:** ранний прототип. Работает базовая анимация кота и главный экран.
> Логика таймера, переключение состояний кота, шторки задач/музыки/настроек — впереди.

---

## 🛠 Стек

- **Vite 8** + **React 19** + **TypeScript 6** — renderer
- **Electron 42** — frameless окно 458×496, ESM main/preload
- Кастомный хук `useSpriteAnimation` на `requestAnimationFrame` —
  рендер кадров без GIF

---

## 🚀 Запуск

### Скрипты

| Скрипт | Что делает |
|---|---|
| `npm run dev` | Параллельно стартует Vite dev-сервер и Electron-окно. |
| `npm run dev:web` | Только Vite в браузере, без Electron |
| `npm run build` | TS-проверка + продакшен-сборка renderer и Electron |
| `npm run build:electron` | Собирает `electron/*.ts` в `dist-electron/*.mjs` |
| `npm run lint` | ESLint |

---

## 🏗 Архитектура — Feature-Sliced Design (light)

Код в `src/` разложен по **слоям FSD**. Документация методологии:
<https://feature-sliced.design/ru/>

```text
src/
├── app/         ← инициализация: entry, провайдеры, глобальные стили
├── pages/       ← страницы (у нас пока одна — main)
├── widgets/     ← композитные блоки экрана (titlebar, cat-stage, ...)
├── features/    ← (пусто пока) пользовательские действия (start-timer, add-task, ...)
├── entities/    ← бизнес-сущности (cat; позже — timer, task, track, settings)
└── shared/      ← переиспользуемое без бизнес-смысла (ui-kit, libs, assets)
```

### Главное правило: импорты только сверху вниз

```text
app → pages → widgets → features → entities → shared
```

- `widgets/titlebar` может импортить из `shared/`, `entities/`, `features/` ✓
- `entities/cat` НЕ может импортить из `widgets/` или `features/` ✗
- Слайсы внутри одного слоя друг от друга **не зависят** (`widgets/titlebar` не лезет в `widgets/cat-stage`)

Это даёт **гарантированную развязанность**: фичу можно удалить или переписать, не сломав соседние.

### Public API через `index.ts`

Каждый слайс наружу торчит **только тем что экспортит из своего `index.ts`**. Внутренности недоступны:

```ts
// src/entities/cat/index.ts
export { Cat } from './ui/Cat';
// useSpriteAnimation НЕ экспортится — это внутренняя кухня entity

// src/widgets/cat-stage/ui/CatStage.tsx
import { Cat } from '@/entities/cat';                       // ✓ через Public API
import { useSpriteAnimation } from '@/entities/cat/lib/...'; // ✗ нельзя
```

### Структура слайса (сегменты)

```text
src/<layer>/<slice>/
├── ui/        ← React-компоненты (отвечают только за рендер)
├── model/     ← состояние и логика (Zustand-сторы, селекторы)
├── lib/       ← вспомогательные функции, хуки
├── api/       ← сетевые вызовы (у нас пока пусто)
└── index.ts   ← Public API
```

Не все сегменты обязательны — добавляются по необходимости.

### Path alias

В `vite.config.ts` и `tsconfig.app.json` настроен алиас:

```ts
'@/*' → 'src/*'
```

Импорты выглядят так: `import { Cat } from '@/entities/cat';` вместо `'../../../../entities/cat'`.

### Workflow для новой фичи

Пример: добавляем логику таймера (Issue #1).

1. **Создаём entity** `src/entities/timer/`:
   - `model/store.ts` — Zustand store: `timeLeft`, `isRunning`, actions
   - `model/useTimerCountdown.ts` — хук с `setInterval`
   - `lib/format.ts` — `formatTime(seconds): "25:00"`
   - `ui/TimerDisplay.tsx` — `<span>{formatted}</span>`
   - `index.ts` — экспортит `useTimerStore`, `TimerDisplay`
2. **Создаём features** в `src/features/`:
   - `start-timer/ui/StartButton.tsx` — вызывает `useTimerStore.start()`
   - `reset-timer/ui/ResetButton.tsx` — вызывает `useTimerStore.reset()`
3. **Обновляем widget** `src/widgets/timer-panel`:
   - Заменяем плейсхолдер `<span>25:00</span>` на `<TimerDisplay />`
   - Заменяем плейсхолдер `IconButton` на `<StartButton />` и `<ResetButton />`

Page (`MainScreen`) и другие виджеты — не трогаем. Изменения локализованы.

---

## ⌨ Архитектурные принципы

В дополнение к FSD стараемся придерживаться:

- **DRY** — повторяющиеся UI-паттерны выносим в `shared/ui/`,
  магические числа — в CSS-переменные (`--scale` etc.) и `shared/config.ts`.
- **KISS** — без преждевременной декомпозиции. Файлов делаем столько, сколько реально нужно.
- **YAGNI** — не добавляем фичи «впрок». Сначала кейс — потом код.
- **SRP** — каждый файл отвечает за одно: `ui/` рендерит, `model/` хранит состояние,
  `lib/` помогает.

---

## 🪪 Лицензия

**GNU GPL 3.0** ([`LICENSE`](LICENSE)).

Лицензия копилефт, обусловлена использованием шрифта Arcade Jeu (тоже GPL 3.0).
Это означает: любой производный код должен распространяться под совместимой
лицензией с открытым исходником.

### Лицензии используемых ассетов

| Ассет | Лицензия | Источник |
|---|---|---|
| Arcade Jeu (шрифт) | GPL 3.0 | https://fonts-online.ru/fonts/arcade-jeu |
| Press Start 2P (шрифт) | OFL | https://fonts.google.com/specimen/Press+Start+2P |
| Спрайты кота + UI-элементы | © команда проекта | внутренний дизайн |

---

## 🤝 Контрибьюция

Проект open source, но текущая команда уже сформирована — внешний контрибьют рассматриваем
в индивидуальном порядке. Перед PR — пожалуйста, открой issue с описанием идеи,
обсудим направление.

### Workflow

```bash
# Каждая новая фича/багфикс — отдельная ветка
git checkout -b feat/timer-logic

# Делаешь работу, коммитишь
git commit -m "feat(timer): add countdown logic"
git push -u origin feat/timer-logic

# Открываешь Pull Request на GitHub
# Команда ревьюит → одобряет → merge в main
# Issue закрывается автоматически если в PR описании есть "Closes #1"
```

### Стиль кода

- TypeScript strict
- ESLint конфиг — `eslint.config.js`
- Перед коммитом — `npm run lint`
