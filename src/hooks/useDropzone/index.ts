import { useEffect, useMemo, useRef, useState } from 'react'

export const useDropzone = (
  onDrop,
  dragHandler = {},
  draggingStyle = { border: 'dashed grey 3px' },
  dragOverStyle = {
    border: 'dashed grey 3px'
  }
) => {
  const ref = useRef(null)
  const [cleanup, setCleanup] = useState(false)
  const [isDragging, setDragging] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const handle = useMemo(dragHandler, [])

  const eventListeners = {
    dragenter: e => {
      return handle.dragEnter(e, () => {
        if (!dragOver) setDragOver(true)
      })
    },
    dragleave: e => {
      return handle.dragLeave(e, () => {
        setDragOver(false)
      })
    },
    dragover: handle.dragBegin,
    drop: e => {
      return handle.drop(e, files => {
        if (typeof onDrop === 'function') onDrop(files, e)
        setDragOver(false)
        setDragging(false)
      })
    }
  }

  const windowListeners = {
    dragenter: e => {
      return handle.body.dragEnter(e, () => {
        if (!isDragging) setDragging(true)
      })
    },
    dragleave: e => {
      return handle.body.dragLeave(e, () => {
       
              if (isDragging) setDragging(false)
      })
    },
    dragend: () => {
       
          },
    drop: e => {
      return handle.body.drop(e, () => {
        setDragging(false)
        setDragOver(false)
      })
    }
  }

  useEffect(() => {
    if (ref.current) {
      const { current } = ref
      Object.keys(eventListeners).forEach(key => { return current.addEventListener(key, eventListeners[key]) }
      )
      Object.keys(windowListeners).forEach(key => { return window.addEventListener(key, windowListeners[key]) }
      )
      setCleanup(true)
    }

    return () => {
      if (cleanup) {
        const { current } = ref
        if (current) {
          Object.keys(eventListeners).forEach(key => { return current.removeEventListener(key, eventListeners[key]) }
          )
        }
        Object.keys(windowListeners).forEach(key => { return window.removeEventListener(key, windowListeners[key]) }
        )
      }
    }
  }, [ref, windowListeners, cleanup, eventListeners, isDragging, dragOver])

  const dropProps = {
    ref,
    style:
        isDragging || dragOver
          ? dragOver
            ? dragOverStyle
            : draggingStyle
          : undefined
  }
  return { isDragging, dragOver, dropProps }
}
