import React, { useEffect } from 'react';
import './Toast.css';

function Toast({ message }) {
  const [show, setShow] = React.useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
}

export default Toast;
