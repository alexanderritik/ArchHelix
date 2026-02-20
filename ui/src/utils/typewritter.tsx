import React, { useState, useEffect } from 'react';
import { Text } from 'grommet';
interface TypewriterProps {
    text: string;
    delay: number;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, delay }) => {
    const [currentText, setCurrentText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
          const timeout = setTimeout(() => {
            setCurrentText(prevText => prevText + text[currentIndex]);
            setCurrentIndex(prevIndex => prevIndex + 1);
          }, delay);
      
          return () => clearTimeout(timeout);
        }
        if(currentIndex === text.length){
          setTimeout(() => {
            setCurrentIndex(1);
            setCurrentText(text[0]);
          }, 2000);

        }
      }, [currentIndex, delay, text]);

      return <span>{currentText}</span>;
};

export default Typewriter;