import { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    try {
      return JSON.parse(savedValue);
    } catch (error) {
      console.error('Error parsing JSON from localStorage for key:', key, error);
      localStorage.removeItem(key); // Remove corrupted data
    }
  }

  if (initialValue instanceof Function) {
    return initialValue();
  }
  return initialValue;
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => getValue(key, initialValue));

  // This useEffect saves to localStorage whenever `value` changes in this tab
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting item to localStorage for key:', key, error);
    }
  }, [key, value]);

  // This useEffect listens for changes from other tabs and syncs the state
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            setValue(JSON.parse(e.newValue));
          } else {
            // Value was removed from storage in another tab
            setValue(initialValue instanceof Function ? initialValue() : initialValue);
          }
        } catch (error) {
          console.error('Error parsing stored value on storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);


  return [value, setValue] as const;
}