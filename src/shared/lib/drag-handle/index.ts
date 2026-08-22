import { useCallback, useEffect, useRef } from 'react';

const CLICK_SLOP = 4;
const FOLLOW_MARGIN = 10;

type Point = { clientX: number; clientY: number };

export function useDragHandle(apply: (point: Point) => void) {
  const applyRef = useRef(apply);
  const stickyRef = useRef<(() => void) | null>(null);
  const pressRef = useRef({ x: 0, y: 0, moved: false });

  useEffect(() => {
    applyRef.current = apply;
  });

  const stopFollowing = useCallback(() => {
    stickyRef.current?.();
    stickyRef.current = null;
  }, []);

  useEffect(() => stopFollowing, [stopFollowing]);

  const startFollowing = useCallback((element: Element) => {
    stopFollowing();
    const move = (event: MouseEvent) => {
      const box = element.getBoundingClientRect();
      const inside =
        event.clientX >= box.left - FOLLOW_MARGIN &&
        event.clientX <= box.right + FOLLOW_MARGIN &&
        event.clientY >= box.top - FOLLOW_MARGIN &&
        event.clientY <= box.bottom + FOLLOW_MARGIN;
      if (!inside) {
        stopFollowing();
        return;
      }
      applyRef.current(event);
    };
    const stop = () => stopFollowing();
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', stop);
    window.addEventListener('blur', stop);
    stickyRef.current = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', stop);
      window.removeEventListener('blur', stop);
    };
  }, [stopFollowing]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (stickyRef.current) {
        stopFollowing();
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      pressRef.current = { x: event.clientX, y: event.clientY, moved: false };
      applyRef.current(event);
    },
    [stopFollowing],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const press = pressRef.current;
    if (
      Math.abs(event.clientX - press.x) > CLICK_SLOP ||
      Math.abs(event.clientY - press.y) > CLICK_SLOP
    ) {
      press.moved = true;
    }
    applyRef.current(event);
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      event.currentTarget.releasePointerCapture(event.pointerId);
      if (!pressRef.current.moved) startFollowing(event.currentTarget);
    },
    [startFollowing],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
