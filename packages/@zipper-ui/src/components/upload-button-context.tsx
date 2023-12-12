import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

interface UploadContextType {
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

interface UploadProviderProps {
  children: ReactNode;
}

const defaultContextValue: UploadContextType = {
  isUploading: false,
  setIsUploading: () => {
    return;
  },
};

const UploadContext = createContext<UploadContextType>(defaultContextValue);

export const useUploadContext = () => useContext(UploadContext);

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log('context value', isUploading);
  }, [isUploading]);

  return (
    <UploadContext.Provider value={{ isUploading, setIsUploading }}>
      {children}
    </UploadContext.Provider>
  );
};
