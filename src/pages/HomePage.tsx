import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Car, Users, Shield, MapPin, Star, Zap, Clock, TrendingUp, ChevronRight, Smartphone, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-f1driver.jpeg";
import carImg from "@/assets/car-3d.png";
import motoImg from "@/assets/moto-3d.png";
import scheduleImg from "@/assets/schedule-3d.png";
import deliveryImg from "@/assets/delivery-3d.png";
import passengerPhoto from "@/assets/passenger-photo.jpg";
import driverPhoto from "@/assets/driver-photo.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const stats = [
  { value: "50K+", label: "Corridas realizadas", icon: Car },
  { value: "12K+", label: "Usuários ativos", icon: Users },
  { value: "4.9", label: "Avaliação média", icon: Star },
  { value: "98%", label: "Taxa de satisfação", icon: TrendingUp },
];

const HomePage = () => {
  const navigate = useNavigate();

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
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
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
              className="text-lg text-muted-foreground max-w-lg mb-10"
            >
              O app de mobilidade urbana que conecta passageiros e motoristas com tecnologia, segurança e um design premium.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" onClick={() => navigate("/login")} className="glow-blue text-base font-bold px-8 h-14">
                <Users size={18} /> Quero ser passageiro
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-base font-bold px-8 h-14 border-primary/30 hover:bg-primary/10">
                <Car size={18} /> Quero ser motorista
              </Button>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl" />
              <img src={carImg} alt="Carro F1 Driver" className="relative w-72 md:w-96 drop-shadow-2xl" />
              <img src={motoImg} alt="Moto F1 Driver" className="absolute -bottom-4 -left-8 w-32 md:w-40 drop-shadow-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center p-6">
              <stat.icon size={28} className="text-primary mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-black text-gradient-blue">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Serviços */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black">Mais que corridas, uma <span className="text-gradient-blue">plataforma completa</span></h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Transporte, entregas e agendamentos — tudo em um só app.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { img: carImg, title: "Corridas", desc: "Viagens rápidas e seguras pela cidade com motoristas verificados." },
              { img: deliveryImg, title: "Entregas", desc: "Envie e receba pacotes com rastreamento em tempo real." },
              { img: scheduleImg, title: "Agendamento", desc: "Agende corridas com antecedência e nunca se atrase." },
            ].map((item, i) => (
              <motion.div key={item.title} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 text-center"
              >
                <img src={item.img} alt={item.title} className="w-24 h-24 object-contain mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Passageiros */}
      <section className="py-20 px-6 border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative rounded-2xl overflow-hidden">
              <img src={passengerPhoto} alt="Passageira usando o app F1 Driver" className="w-full h-80 md:h-[28rem] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md text-primary text-sm font-bold">
                  <Users size={14} /> Para Passageiros
                </span>
              </div>
            </div>
          </motion.div>
          <div>
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-3xl md:text-4xl font-black mb-8"
            >
              Chegue onde quiser, com <span className="text-gradient-blue">conforto</span>
            </motion.h2>
            <div className="space-y-5">
              {[
                { icon: MapPin, title: "Peça em segundos", desc: "Solicite sua corrida com poucos toques e acompanhe em tempo real." },
                { icon: Shield, title: "Segurança total", desc: "Motoristas verificados, compartilhamento de rota e suporte 24h." },
                { icon: Zap, title: "Preço justo", desc: "Tarifa transparente sem surpresas. Pague com Pix, cartão ou dinheiro." },
                { icon: Clock, title: "Sempre disponível", desc: "Motoristas próximos a qualquer hora do dia ou da noite." },
              ].map((f, i) => (
                <motion.div key={f.title} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5} className="mt-8">
              <Button size="lg" onClick={() => navigate("/login")} className="glow-blue font-bold h-12 px-8">
                Começar agora <ChevronRight size={16} />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Para Motoristas */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-3xl md:text-4xl font-black mb-8"
            >
              Dirija e <span className="text-gradient-blue">ganhe mais</span>
            </motion.h2>
            <div className="space-y-5">
              {[
                { icon: DollarSign, title: "Ganhe mais", desc: "Taxas competitivas e bonificações semanais para os melhores motoristas." },
                { icon: Smartphone, title: "App intuitivo", desc: "Painel completo com ganhos, corridas e histórico na palma da mão." },
                { icon: Clock, title: "Horário flexível", desc: "Dirija quando quiser. Você é o dono do seu tempo." },
                { icon: TrendingUp, title: "Cresça conosco", desc: "Planos de incentivo e suporte dedicado para motoristas parceiros." },
              ].map((f, i) => (
                <motion.div key={f.title} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon size={20} className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5} className="mt-8">
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="font-bold h-12 px-8 border-success/30 text-success hover:bg-success/10">
                Cadastre-se como motorista <ChevronRight size={16} />
              </Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="order-1 md:order-2"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <img src={driverPhoto} alt="Motorista parceiro F1 Driver" className="w-full h-80 md:h-[28rem] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 backdrop-blur-md text-success text-sm font-bold">
                  <Car size={14} /> Para Motoristas
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Credibilidade */}
      <section className="py-20 px-6 border-y border-border bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Por que confiar na <span className="text-gradient-blue">F1 Driver</span>?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Tecnologia de ponta e compromisso com sua segurança.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Shield, title: "Motoristas verificados", desc: "Checagem de antecedentes e documentos obrigatórios para todos os parceiros." },
              { icon: Star, title: "Avaliação contínua", desc: "Sistema de avaliação mútua que garante qualidade em cada corrida." },
              { icon: Zap, title: "Suporte 24h", desc: "Equipe dedicada disponível a qualquer momento para resolver problemas." },
            ].map((item, i) => (
              <motion.div key={item.title} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
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
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <img src={carImg} alt="" className="w-32 mx-auto mb-8 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-black mb-4">Pronto para acelerar?</h2>
            <p className="text-muted-foreground mb-8 text-lg">Crie sua conta agora e experimente a mobilidade urbana do futuro.</p>
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
