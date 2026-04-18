'use client';

import { useState, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from '@/lib/types';

interface CalendarProps {
  appointments: Appointment[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-700',
  confirmed: 'bg-green-100 border-green-300 text-green-700',
  in_progress: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  completed: 'bg-zinc-100 border-zinc-300 text-zinc-700',
  cancelled: 'bg-red-100 border-red-300 text-red-700',
  no_show: 'bg-orange-100 border-orange-300 text-orange-700',
};

export function Calendar({ appointments, onDateClick, onAppointmentClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointmentDate), date)
    );
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Aujourd'hui
              </button>
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                    onDateClick?.(day);
                  }}
                  className={`
                    min-h-[100px] p-2 border-b border-r border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-white dark:bg-zinc-900'}
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isDayToday ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''}
                      ${!isCurrentMonth ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-xs text-zinc-500">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(apt);
                        }}
                        className={`
                          text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity
                          ${statusColors[apt.status] || 'bg-zinc-100 border-zinc-300'}
                        `}
                      >
                        {format(new Date(apt.appointmentDate), 'HH:mm')} {apt.patient?.user?.firstName?.[0]}.
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-zinc-500 pl-1">
                        +{dayAppointments.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {selectedDate 
              ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
              : 'Sélectionnez une date'
            }
          </h3>
          
          {selectedDate ? (
            selectedDateAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAppointments.map(apt => (
                  <div
                    key={apt.id}
                    onClick={() => onAppointmentClick?.(apt)}
                    className={`
                      p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all
                      ${statusColors[apt.status] || 'bg-zinc-100 border-zinc-300'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                      </span>
                      <span className="text-xs font-medium">
                        {format(new Date(apt.appointmentDate), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs opacity-80">{apt.reason}</p>
                    <p className="text-xs mt-1 opacity-60">{apt.durationMinutes} min • {apt.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Aucun rendez-vous ce jour</p>
            )
          ) : (
            <p className="text-sm text-zinc-500">Cliquez sur une date pour voir les détails</p>
          )}
        </div>

        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Légende</h4>
          <div className="space-y-2">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color.split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`} />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
