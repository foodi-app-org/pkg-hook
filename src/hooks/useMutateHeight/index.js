import {
    useEffect,
    useRef,
    useState
} from 'react';


export const  useMutateHeight = ({ isCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const childrenContainerRef = useRef(null);

  useEffect(() => {
    setCollapsed(isCollapsed);
    if (childrenContainerRef.current !== null) {
      const height = isCollapsed
        ? childrenContainerRef.current.scrollHeight
        : 0;
      childrenContainerRef.current.style.height = `${height}px`;
    }
  }, [isCollapsed]);

  const handleCollapsed = visible => {
    setCollapsed(visible);
    if (childrenContainerRef.current !== null) {
      const height = visible ? childrenContainerRef.current.scrollHeight : 0;
      childrenContainerRef.current.style.height = `${height}px`;
    }
  };

  return {
    handleCollapsed,
    childrenContainerRef,
    collapsed
  };
};

// https://codesandbox.io/s/dropdown-navigation-9fx6r?file=/src/Navigation/Navigation.js:357-775