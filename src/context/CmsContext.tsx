import React, { createContext, useContext, useEffect, useState } from 'react';
import { FullWebsiteCMS, ContentPageCMS } from '../types/cms';
import { CmsService, DEFAULT_CMS } from '../services/cmsService';

interface CmsContextType {
  cms: FullWebsiteCMS;
  loading: boolean;
  refreshCMS: () => Promise<void>;
  getPageBySlug: (slug: string) => ContentPageCMS | undefined;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cms, setCms] = useState<FullWebsiteCMS>(DEFAULT_CMS);
  const [loading, setLoading] = useState(true);

  const refreshCMS = async () => {
    try {
      const data = await CmsService.getPublishedCMS();
      setCms(data);
    } catch (err) {
      console.warn('Failed to refresh CMS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCMS();
  }, []);

  const getPageBySlug = (slug: string) => {
    return cms.pages?.find(p => p.slug === slug);
  };

  return (
    <CmsContext.Provider value={{ cms, loading, refreshCMS, getPageBySlug }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
