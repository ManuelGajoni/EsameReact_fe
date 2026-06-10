"use client";

import { useState, useRef, useEffect } from "react";

const FIELD_TYPES = ["Calcio a 5", "Calcio a 7", "Calcio a 11", "Padel", "Tennis"];

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
const DAY_NAMES = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

function getNextHalfHour(): string {
  const now = new Date();
  if (now.getMinutes() < 30) {
    now.setMinutes(30, 0, 0);
  } else {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  }
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatDateIT(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function CalendarDropdown({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (number | null)[] = [
    ...Array<null>(adjustedFirst).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 w-72">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium pb-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (cell === null) return <div key={`e${i}`} />;
          const cellDate = new Date(year, month, cell);
          const isPast = cellDate < today;
          const isSelected =
            cell === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
          return (
            <button
              key={cell}
              disabled={isPast}
              onClick={() => {
                onSelect(new Date(year, month, cell));
                onClose();
              }}
              className={[
                "flex items-center justify-center text-sm rounded-full w-8 h-8 mx-auto transition-colors",
                isPast ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-green-50",
                isSelected ? "bg-green-600 text-white hover:bg-green-600" : "",
              ].join(" ")}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeModal({
  selectedTime,
  onSelect,
  onClose,
}: {
  selectedTime: string;
  onSelect: (t: string) => void;
  onClose: () => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-5 w-56"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
          Seleziona orario
        </h3>
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              ref={slot === selectedTime ? selectedRef : undefined}
              onClick={() => {
                onSelect(slot);
                onClose();
              }}
              className={[
                "w-full text-center py-2 rounded-lg text-sm font-medium transition-colors",
                slot === selectedTime
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-50 text-gray-700",
              ].join(" ")}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchBar() {
  const [city, setCity] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string>(() => getNextHalfHour());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isCalendarOpen]);

  return (
    <div className="bg-green-600 py-4 shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch overflow-visible">
          {/* Città / centro sportivo */}
          <div className="flex-1 flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Città o centro sportivo"
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>

          {/* Tipo di campo */}
          <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18M10 3v18M14 3v18"
              />
            </svg>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent appearance-none cursor-pointer pr-2"
            >
              <option value="">Tipo di campo</option>
              {FIELD_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="relative flex items-center border-b md:border-b-0 md:border-r border-gray-200" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-4 py-3 w-full h-full text-left hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-700 whitespace-nowrap">
                {formatDateIT(selectedDate)}
              </span>
            </button>
            {isCalendarOpen && (
              <CalendarDropdown
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                onClose={() => setIsCalendarOpen(false)}
              />
            )}
          </div>

          {/* Orario */}
          <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z"
              />
            </svg>
            <button
              onClick={() => setIsTimeModalOpen(true)}
              className="text-sm text-gray-700 whitespace-nowrap hover:text-green-600 transition-colors"
            >
              {selectedTime}
            </button>
          </div>

          {/* Bottone CERCA */}
          <div className="px-3 py-3 flex items-center">
            <button className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2.5 rounded-xl transition-colors text-sm tracking-widest">
              CERCA
            </button>
          </div>
        </div>
      </div>

      {isTimeModalOpen && (
        <TimeModal
          selectedTime={selectedTime}
          onSelect={setSelectedTime}
          onClose={() => setIsTimeModalOpen(false)}
        />
      )}
    </div>
  );
}
