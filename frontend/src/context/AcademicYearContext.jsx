import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AcademicYearContext = createContext();

const STORAGE_KEY = "selectedAcademicYear";
const API = import.meta.env.VITE_API_URL;

export const useAcademicYear = () => useContext(AcademicYearContext);

export const AcademicYearProvider = ({ children }) => {
  // Restore from localStorage on mount
  const [selectedYear, setSelectedYear] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [years, setYears]       = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const fetchYears = useCallback(async () => {
    setLoadingYears(true);
    try {
      const res  = await fetch(`${API}/academic-years`);
      const data = await res.json();
      if (data.success) {
        setYears(data.data || []);
        // If nothing selected yet, auto-select the active year
        if (!selectedYear) {
          const active = data.data.find((y) => y.isActive) || data.data[0];
          if (active) selectYear(active);
        }
      }
    } catch { /* silent */ }
    finally { setLoadingYears(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchYears(); }, [fetchYears]);

  const selectYear = (year) => {
    setSelectedYear(year);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(year));
  };

  const clearYear = () => {
    setSelectedYear(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AcademicYearContext.Provider value={{ selectedYear, years, loadingYears, selectYear, clearYear, fetchYears }}>
      {children}
    </AcademicYearContext.Provider>
  );
};
