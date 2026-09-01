import { useEffect, useState } from "react";

const useCountdown = (initialTime: number = 600) => {
  const [time, setTime] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (time <= 0) {
      setIsExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  const reset = () => {
    setTime(initialTime);
    setIsExpired(false);
  };

  const formatTime = () => {
    const min = Math.floor(time / 60);
    const sec = String(time % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return {
    time,
    isExpired,
    reset,
    formatTime,
  };
};

export default useCountdown;
