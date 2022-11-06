import { useEffect, useState } from 'react'

export const useOnScreen = (threshold = 0.6) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState(null)

  useEffect(
    () => {
      let observer
      if (ref) {
        observer = new IntersectionObserver(
          ([entry]) => {
            setIsVisible(entry.isIntersecting)
          },
          {
            // rootMargin,
            threshold
          }
        )
        observer.observe(ref)
      }

      return () => {
        if (ref && observer) observer.unobserve(ref)
      }
    },
    [ref]
  )

  return [setRef, isVisible]
}

const defaultObserverOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px"
};
export const useIntersectionObserver = ({ el, onEnter, active = true, options = defaultObserverOptions })  => {
    useEffect(() => {
        let observer;
        const refEl = el.current;
        if (IntersectionObserver && active && refEl) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => entry.isIntersecting && onEnter());
            }, options);
            observer.observe(refEl);
        }
        return () => {
            observer === null || observer === void 0 ? void 0 : observer.disconnect(refEl);
        };
    }, [el, onEnter, active, options]);
}
