import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RideChatProps {
  rideId: string;
  isDriver: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const RideChat = ({ rideId, isDriver }: RideChatProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rideId) return;

    // Load existing messages
    supabase
      .from("ride_messages")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${rideId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ride_messages", filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, msg]);
          if (!open && msg.sender_id !== user?.id) {
            setUnread((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [open, messages.length]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText("");
    await supabase.from("ride_messages").insert({
      ride_id: rideId,
      sender_id: user.id,
      message: msg,
    } as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 left-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl transition-transform active:scale-95"
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg bg-secondary">
                <X size={20} className="text-foreground" />
              </button>
              <h2 className="text-base font-bold flex-1">
                {isDriver ? "Chat com passageiro" : "Chat com motorista"}
              </h2>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma mensagem ainda. Diga olá! 👋
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RideChat;
