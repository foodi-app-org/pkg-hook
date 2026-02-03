import { useEffect, useMemo, useRef, useState, CSSProperties } from 'react'

type DropHandler = (files: FileList | null, event: DragEvent) => void

type DragHandler = {
  dragEnter?: (e: DragEvent, cb: () => void) => void
  dragLeave?: (e: DragEvent, cb: () => void) => void
  dragBegin?: (e: DragEvent) => void
  drop?: (e: DragEvent, cb: (files: FileList | null) => void) => void
  body?: {
    dragEnter?: (e: DragEvent, cb: () => void) => void
    dragLeave?: (e: DragEvent, cb: () => void) => void
    dragEnd?: (e: DragEvent) => void
    drop?: (e: DragEvent, cb: () => void) => void
  }
}

const defaultDraggingStyle: CSSProperties = { border: 'dashed grey 3px' }
const defaultDragOverStyle: CSSProperties = { border: 'dashed grey 3px' }

export const useDropzone = (
  onDrop: DropHandler,
  dragHandler: DragHandler = {},
  draggingStyle: CSSProperties = defaultDraggingStyle,
  dragOverStyle: CSSProperties = defaultDragOverStyle
) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [cleanup, setCleanup] = useState(false)
  const [isDragging, setDragging] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const handle = useMemo<DragHandler>(() => dragHandler, [dragHandler])

  const eventListeners: {
    [key: string]: ((e: DragEvent) => void) | undefined
  } = {
    dragenter: (e: DragEvent) => {
      handle.dragEnter?.(e, () => {
        if (!dragOver) setDragOver(true)
      })
    },
    dragleave: (e: DragEvent) => {
      handle.dragLeave?.(e, () => {
        setDragOver(false)
      })
    },
    dragover: handle.dragBegin
      ? (e: DragEvent) => handle.dragBegin?.(e)
      : undefined,
    drop: (e: DragEvent) => {
      handle.drop?.(e, (files: FileList | null) => {
        if (typeof onDrop === 'function') onDrop(files, e)
        setDragOver(false)
        setDragging(false)
      })
    }
  }

  const windowListeners: {
    [key: string]: (e: DragEvent) => void | (() => void)
  } = {
    dragenter: (e: DragEvent) => {
      handle.body?.dragEnter?.(e, () => {
        if (!isDragging) setDragging(true)
      })
    },
    dragleave: (e: DragEvent) => {
      handle.body?.dragLeave?.(e, () => {
        if (isDragging) setDragging(false)
      })
    },
    dragend: (e: DragEvent) => {
      handle.body?.dragEnd?.(e)
    },
    drop: (e: DragEvent) => {
      handle.body?.drop?.(e, () => {
        setDragging(false)
        setDragOver(false)
      })
    }
  }

  useEffect(() => {
    if (ref.current) {
      const { current } = ref
      Object.keys(eventListeners).forEach(key => {
        const listener = eventListeners[key as keyof typeof eventListeners]
        if (listener) {
          current.addEventListener(key, listener as EventListener)
        }
      })
      Object.keys(windowListeners).forEach(key => {
        const listener = windowListeners[key]
        if (listener) {
          globalThis.addEventListener(key, listener as EventListener)
        }
      })
      setCleanup(true)
    }

    return () => {
      if (cleanup) {
        const { current } = ref
        if (current) {
          Object.keys(eventListeners).forEach(key => {
            const listener = eventListeners[key as keyof typeof eventListeners]
            if (listener) {
              current.removeEventListener(key, listener as EventListener)
            }
          })
        }
        Object.keys(windowListeners).forEach(key => {
          const listener = windowListeners[key]
          if (listener) {
            globalThis.removeEventListener(key, listener as EventListener)
          }
        })
      }
    }
  }, [ref, windowListeners, cleanup, eventListeners, isDragging, dragOver])

  let style: CSSProperties | undefined
  if (isDragging || dragOver) {
    style = dragOver ? dragOverStyle : draggingStyle
  } else {
    style = undefined
  }

  const dropProps = {
    ref,
    style
  }
  return { isDragging, dragOver, dropProps }
}
