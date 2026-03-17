import { useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ScheduleRidePickerProps {
  onSchedule: (dateTime: Date) => void;
  onCancel: () => void;
}

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

const ScheduleRidePicker = ({ onSchedule, onCancel }: ScheduleRidePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");

  const handleConfirm = () => {
    if (!date || !time) return;
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    if (dt <= new Date()) return;
    onSchedule(dt);
  };

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 flex items-end justify-center"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Agendar corrida
          </h3>
          <button onClick={onCancel} className="p-2 rounded-lg bg-secondary">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">Escolha a data e horário desejados.</p>

        <CalendarUI
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(d) => d < minDate}
          className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
          locale={ptBR}
        />

        {date && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock size={12} /> Horário
            </p>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {timeSlots
                .filter((t) => {
                  if (!date) return true;
                  const now = new Date();
                  if (date.toDateString() === now.toDateString()) {
                    const [h, m] = t.split(":").map(Number);
                    return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
                  }
                  return true;
                })
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      time === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
            </div>
          </div>
        )}

        {date && time && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
            <p className="text-sm text-center font-semibold text-primary">
              {format(date, "dd 'de' MMMM", { locale: ptBR })} às {time}
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!date || !time}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          Confirmar agendamento
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ScheduleRidePicker;
