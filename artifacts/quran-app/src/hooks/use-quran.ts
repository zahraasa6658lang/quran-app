import { useQuery } from '@tanstack/react-query';

export interface Ayah {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
}

export interface QuranPageResponse {
  code: number;
  status: string;
  data: {
    number: number;
    ayahs: Ayah[];
    surahs: Record<string, Ayah['surah']>;
    edition: {
      identifier: string;
      language: string;
      name: string;
      englishName: string;
      format: string;
      type: string;
    };
  };
}

export const fetchQuranPage = async (pageNumber: number): Promise<QuranPageResponse['data']> => {
  const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
  if (!res.ok) throw new Error('Failed to fetch Quran page');
  const json = await res.json();
  return json.data;
};

export const useQuranPage = (pageNumber: number) => {
  return useQuery({
    queryKey: ['quran-page', pageNumber],
    queryFn: () => fetchQuranPage(pageNumber),
    staleTime: Infinity, // Never stale, data is static
  });
};

export interface SurahListItem {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export const fetchSurahList = async (): Promise<SurahListItem[]> => {
  const res = await fetch('https://api.alquran.cloud/v1/surah');
  if (!res.ok) throw new Error('Failed to fetch Surah list');
  const json = await res.json();
  return json.data;
};

export const useSurahList = () => {
  return useQuery({
    queryKey: ['surah-list'],
    queryFn: fetchSurahList,
    staleTime: Infinity,
  });
};

export const fetchMeta = async () => {
  const res = await fetch('https://api.alquran.cloud/v1/meta');
  if (!res.ok) throw new Error('Failed to fetch Meta');
  const json = await res.json();
  return json.data;
};

export const useMeta = () => {
  return useQuery({
    queryKey: ['meta'],
    queryFn: fetchMeta,
    staleTime: Infinity,
  });
};
