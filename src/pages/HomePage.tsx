import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Car, Users, Shield, MapPin, Star, Zap, Clock, TrendingUp, ChevronRight, Smartphone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-f1driver.jpeg";

const stats = [
  { value: "50K+", label: "Corridas realizadas", icon: Car },
  { value: "12K+", label: "Usuários ativos", icon: Users },
  { value: "4.9", label: "Avaliação média", icon: Star },
  { value: "98%", label: "Taxa de satisfação", icon: TrendingUp },
];

const passengerFeatures = [
  { icon: MapPin, title: "Peça em segundos", desc: "Solicite sua corrida com poucos toques e acompanhe em tempo real." },
  { icon: Shield, title: "Segurança total", desc: "Motoristas verificados, compartilhamento de rota e suporte 24h." },
  { icon: Zap, title: "Preço justo", desc: "Tarifa transparente sem surpresas. Pague com Pix, cartão ou dinheiro." },
  { icon: Clock, title: "Sempre disponível", desc: "Motoristas próximos a qualquer hora do dia ou da noite." },
];

const driverFeatures = [
  { icon: DollarSign, title: "Ganhe mais", desc: "Taxas competitivas e bonificações semanais para os melhores motoristas." },
  { icon: Smartphone, title: "App intuitivo", desc: "Painel completo com ganhos, corridas e histórico na palma da mão." },
  { icon: Clock, title: "Horário flexível", desc: "Dirija quando quiser. Você é o dono do seu tempo." },
  { icon: TrendingUp, title: "Cresça conosco", desc: "Planos de incentivo e suporte dedicado para motoristas parceiros." },
];

const HomePage = () => {
  const navigate = useNavigate();

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="F1 Driver" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-lg font-bold text-gradient-blue">F1 Driver</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-semibold">
              Entrar
            </Button>
            <Button onClick={() => navigate("/login")} className="glow-blue text-sm font-bold">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <img src={logo} alt="F1 Driver" className="w-28 h-28 rounded-2xl mx-auto mb-8 object-cover shadow-2xl" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-6xl font-black leading-tight mb-6"
          >
            Sua corrida na{" "}
            <span className="text-gradient-blue">velocidade</span>{" "}
            que você merece
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            O app de mobilidade urbana que conecta passageiros e motoristas com tecnologia, segurança e um design premium.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" onClick={() => navigate("/login")} className="glow-blue text-base font-bold px-8 h-14">
              <Users size={18} /> Quero ser passageiro
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-base font-bold px-8 h-14 border-primary/30 hover:bg-primary/10">
              <Car size={18} /> Quero ser motorista
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center p-6"
            >
              <stat.icon size={28} className="text-primary mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-black text-gradient-blue">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Passageiros */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
              <Users size={14} /> Para Passageiros
            </span>
            <h2 className="text-3xl md:text-4xl font-black">Chegue onde quiser, com <span className="text-gradient-blue">conforto</span></h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Mobilidade urbana rápida, segura e sem complicação.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {passengerFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" onClick={() => navigate("/login")} className="glow-blue font-bold h-12 px-8">
              Começar agora <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Motoristas */}
      <section className="py-20 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-bold mb-4">
              <Car size={14} /> Para Motoristas
            </span>
            <h2 className="text-3xl md:text-4xl font-black">Dirija e <span className="text-gradient-blue">ganhe mais</span></h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Seja parceiro F1 Driver e tenha controle total dos seus ganhos.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {driverFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
                  <f.icon size={22} className="text-success" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="font-bold h-12 px-8 border-success/30 text-success hover:bg-success/10">
              Cadastre-se como motorista <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Credibilidade */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-black mb-6">Por que confiar na <span className="text-gradient-blue">F1 Driver</span>?</h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {[
              { icon: Shield, title: "Motoristas verificados", desc: "Checagem de antecedentes e documentos obrigatórios para todos os parceiros." },
              { icon: Star, title: "Avaliação contínua", desc: "Sistema de avaliação mútua que garante qualidade em cada corrida." },
              { icon: Zap, title: "Suporte 24h", desc: "Equipe dedicada disponível a qualquer momento para resolver problemas." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Pronto para acelerar?</h2>
            <p className="text-muted-foreground mb-8 text-lg">Baixe o app ou crie sua conta agora e experimente a mobilidade urbana do futuro.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/login")} className="glow-blue text-base font-bold px-8 h-14">
                Criar conta grátis
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/login")} className="text-base font-bold px-8 h-14">
                Já tenho conta
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="F1 Driver" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-sm text-gradient-blue">F1 Driver</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 F1 Driver. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
