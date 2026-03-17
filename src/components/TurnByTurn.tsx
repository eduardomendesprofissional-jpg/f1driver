import { useState, useEffect } from "react";
import { Navigation, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

interface TurnByTurnProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

interface Step {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: { type: string; modifier?: string };
}

const maneuverIcon = (type: string, modifier?: string) => {
  if (type === "turn") {
    if (modifier === "left") return "↰";
    if (modifier === "right") return "↱";
    if (modifier === "sharp left") return "⤺";
    if (modifier === "sharp right") return "⤻";
    if (modifier === "slight left") return "↖";
    if (modifier === "slight right") return "↗";
  }
  if (type === "merge") return "⤴";
  if (type === "roundabout") return "↻";
  if (type === "arrive") return "🏁";
  if (type === "depart") return "🚗";
  return "→";
};

const TurnByTurn = ({ originLat, originLng, destLat, destLng }: TurnByTurnProps) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${MAPBOX_TOKEN}&steps=true&language=pt-BR&overview=full`
        );
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.legs?.[0]?.steps) {
          setSteps(
            route.legs[0].steps.map((s: any) => ({
              instruction: s.maneuver.instruction,
              distance: s.distance,
              duration: s.duration,
              maneuver: { type: s.maneuver.type, modifier: s.maneuver.modifier },
            }))
          );
        }
      } catch {
        // silently fail
      }
    };
    fetchDirections();
  }, [originLat, originLng, destLat, destLng]);

  useEffect(() => {
    if (voiceOn && steps[currentStep]) {
      const utterance = new SpeechSynthesisUtterance(steps[currentStep].instruction);
      utterance.lang = "pt-BR";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep, voiceOn]);

  if (steps.length === 0) return null;

  const current = steps[currentStep];
  const nextStep = steps[currentStep + 1];

  return (
    <div className="space-y-2">
      {/* Current instruction */}
      <motion.div
        layout
        className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{maneuverIcon(current.maneuver.type, current.maneuver.modifier)}</span>
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">{current.instruction}</p>
            <p className="text-xs opacity-75 mt-0.5">
              {current.distance >= 1000
                ? `${(current.distance / 1000).toFixed(1)} km`
                : `${Math.round(current.distance)} m`}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setVoiceOn(!voiceOn)}
              className="p-1.5 rounded-lg bg-primary-foreground/10"
            >
              {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Next instruction preview */}
      {nextStep && (
        <div className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg opacity-60">
            {maneuverIcon(nextStep.maneuver.type, nextStep.maneuver.modifier)}
          </span>
          <p className="text-xs text-muted-foreground flex-1 truncate">{nextStep.instruction}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {nextStep.distance >= 1000
              ? `${(nextStep.distance / 1000).toFixed(1)} km`
              : `${Math.round(nextStep.distance)} m`}
          </span>
        </div>
      )}

      {/* All steps (expandable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-xs text-primary font-semibold py-1"
      >
        {expanded ? "Ocultar etapas" : `Ver todas (${steps.length} etapas)`}
        <ChevronRight size={12} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                    i === currentStep ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-sm">{maneuverIcon(step.maneuver.type, step.maneuver.modifier)}</span>
                  <p className="text-xs flex-1 truncate">{step.instruction}</p>
                  <span className="text-[10px] shrink-0">
                    {step.distance >= 1000
                      ? `${(step.distance / 1000).toFixed(1)} km`
                      : `${Math.round(step.distance)} m`}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex-1 py-2 rounded-xl bg-secondary text-xs font-semibold disabled:opacity-30"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep >= steps.length - 1}
          className="flex-1 py-2 rounded-xl bg-secondary text-xs font-semibold disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
};

export default TurnByTurn;
