
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icons } from './Shared';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  theme: any;
  themeKey: string;
  placeholder?: string;
  allowPast?: boolean;
}

export function CustomDatePicker({ value, onChange, theme, themeKey, placeholder = "Selecione uma data", allowPast = true }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const selectedDate = value ? new Date(value + 'T12:00:00') : null;

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 px-2">
        <button type="button" onClick={prevMonth} className={`p-2 ${theme.ghost} rounded-full transition-colors`}>
          <Icons.ChevronLeft size={18} />
        </button>
        <span className={`font-bold capitalize ${themeKey === 'solar' ? 'text-slate-800' : 'text-white'}`}>
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button type="button" onClick={nextMonth} className={`p-2 ${theme.ghost} rounded-full transition-colors`}>
          <Icons.ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-[10px] opacity-40 uppercase py-2">
          {format(addDays(startDate, i), 'EEEEEE', { locale: ptBR })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    const today = startOfDay(new Date());

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isPast = isBefore(day, today) && !isSameDay(day, today);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={!allowPast && isPast}
            onClick={() => {
              const formatted = format(cloneDay, 'yyyy-MM-dd');
              onChange(formatted);
              setIsOpen(false);
            }}
            className={`p-2 w-9 h-9 mx-auto flex items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
              isSelected
                ? `${theme.primary} shadow-lg`
                : (!allowPast && isPast)
                ? 'opacity-20 cursor-not-allowed'
                : !isCurrentMonth
                ? 'opacity-20 hover:opacity-100'
                : `${theme.ghost} ${themeKey === 'solar' ? 'text-slate-700' : 'text-white'}`
            }`}
          >
            {format(day, 'd')}
            {isToday && !isSelected && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${themeKey === 'solar' ? 'bg-amber-500' : 'bg-white'}`}></div>
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="relative" ref={datePickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${theme.inner} border ${theme.divider} ${theme.text} rounded-xl px-4 py-2 text-sm outline-none transition-all hover:border-opacity-50`}
      >
        <Icons.Calendar size={16} className="opacity-50" />
        <span className="font-bold">
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
        </span>
        <Icons.ChevronDown size={14} className={`opacity-40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute z-[100] left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-2 w-72 max-w-[calc(100vw-2rem)] ${theme.card} border ${theme.border} rounded-2xl shadow-2xl p-4 overflow-hidden`}
          >
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
