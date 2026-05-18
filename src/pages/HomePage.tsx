import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Car, Users, Shield, MapPin, Star, Zap, Clock, TrendingUp, ChevronRight, Smartphone, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-f1driver.jpeg";
import carImg from "@/assets/car-3d.png";
import heroPhones from "@/assets/hero-phones.png";
import heroBg from "@/assets/hero-bg.png";
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
  { value: "—", label: "Corridas realizadas", icon: Car },
  { value: "—", label: "Usuários ativos", icon: Users },
  { value: "—", label: "Avaliação média", icon: Star },
  { value: "—", label: "Taxa de satisfação", icon: TrendingUp },
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
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.05] pointer-events-none" />
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
              <Button size="lg" variant="outline" onClick={() => navigate("/login/motorista")} className="text-base font-bold px-8 h-14 border-primary/30 hover:bg-primary/10">
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
              <img src={heroPhones} alt="App F1 Driver em smartphones" className="relative w-[22rem] md:w-[38rem] drop-shadow-2xl" />
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
              <Button size="lg" variant="outline" onClick={() => navigate("/login/motorista")} className="font-bold h-12 px-8 border-success/30 text-success hover:bg-success/10">
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
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Logo & Sobre */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="F1 Driver" className="w-12 h-12 rounded-xl object-cover" />
                <span className="text-xl font-black text-gradient-blue">F1 Driver</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                A F1 Driver é a plataforma de mobilidade urbana que conecta passageiros e motoristas com tecnologia de ponta, segurança e um design premium. Nossa missão é transformar a forma como você se move pela cidade.
              </p>
              {/* Redes Sociais */}
              <div className="flex gap-3 mt-6">
                {[
                  { label: "Instagram", href: "#", icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  )},
                  { label: "Facebook", href: "#", icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  )},
                  { label: "Twitter/X", href: "#", icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  )},
                  { label: "TikTok", href: "#", icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  )},
                  { label: "YouTube", href: "#", icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  )},
                ].map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links Rápidos */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-foreground">Navegação</h4>
              <ul className="space-y-3">
                {["Início", "Para Passageiros", "Para Motoristas", "Segurança", "Suporte"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3">
                {["Termos de Uso", "Política de Privacidade", "Política de Cookies", "LGPD"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider + Bottom */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 F1 Driver. Todos os direitos reservados.</p>
            <p className="text-xs text-muted-foreground">
              Desenvolvido com <span className="text-primary">💙</span> por <span className="font-bold text-foreground">Orapt GM</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
