import { useState, useRef, useCallback } from "react";

/**
 * Hook que detecta a direção do scroll de um elemento com ref,
 * ocultando a navegação ao rolar para baixo e revelando ao rolar para cima.
 */
export function useScrollDirection(threshold = 50) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const currentScrollY = scrollRef.current.scrollTop;
    const isMobile = window.innerWidth < 768;

    if (isMobile && currentScrollY > lastScrollY.current && currentScrollY > threshold) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
  }, [threshold]);

  return { isVisible, scrollRef, handleScroll };
}