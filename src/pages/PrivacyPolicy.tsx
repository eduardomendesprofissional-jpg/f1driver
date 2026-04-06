import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="p-4 flex items-center gap-3 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Privacidade</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto prose prose-sm text-foreground">
        <p className="text-muted-foreground text-xs mb-6">Última atualização: 06 de abril de 2026</p>

        <h2 className="text-base font-bold mt-6 mb-2">1. Introdução</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-foreground">F1 Driver</strong> valoriza a privacidade dos seus usuários. 
          Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos 
          suas informações pessoais ao utilizar nosso aplicativo de mobilidade urbana.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">2. Dados que Coletamos</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li><strong className="text-foreground">Dados de cadastro:</strong> nome completo, endereço de e-mail, CPF, telefone e data de nascimento.</li>
          <li><strong className="text-foreground">Localização GPS:</strong> coordenadas em tempo real durante corridas ativas para encontrar motoristas, calcular rotas e estimar tempo de chegada.</li>
          <li><strong className="text-foreground">Fotos e imagens:</strong> foto de perfil (avatar), selfie de verificação facial e comprovantes de pagamento.</li>
          <li><strong className="text-foreground">Dados do veículo (motoristas):</strong> modelo, cor, placa e CNH.</li>
          <li><strong className="text-foreground">Dados de uso:</strong> histórico de corridas, avaliações, métodos de pagamento e preferências.</li>
          <li><strong className="text-foreground">Dados do dispositivo:</strong> tokens de notificação push e tipo de plataforma.</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-2">3. Como Usamos seus Dados</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>Conectar passageiros a motoristas próximos.</li>
          <li>Calcular rotas, distâncias e tarifas.</li>
          <li>Processar pagamentos e gerenciar saldo.</li>
          <li>Verificar identidade e prevenir fraudes.</li>
          <li>Enviar notificações sobre corridas e atualizações do serviço.</li>
          <li>Melhorar a experiência do usuário e a segurança da plataforma.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-2">4. Compartilhamento de Dados</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Compartilhamos seus dados apenas nas seguintes situações:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li><strong className="text-foreground">Entre usuários:</strong> nome e localização são compartilhados entre passageiro e motorista durante uma corrida ativa.</li>
          <li><strong className="text-foreground">Provedores de serviço:</strong> serviços de mapas (TomTom), armazenamento em nuvem e processamento de notificações.</li>
          <li><strong className="text-foreground">Obrigações legais:</strong> quando exigido por lei, ordem judicial ou autoridade competente.</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          <strong className="text-foreground">Não vendemos</strong> seus dados pessoais a terceiros.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">5. Armazenamento e Segurança</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Seus dados são armazenados em servidores seguros com criptografia e controle de acesso. 
          Implementamos políticas de segurança em nível de linha (RLS) para garantir que cada usuário 
          acesse apenas seus próprios dados.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">6. Seus Direitos (LGPD)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>Acessar seus dados pessoais.</li>
          <li>Corrigir dados incompletos ou desatualizados.</li>
          <li>Solicitar a exclusão dos seus dados e conta.</li>
          <li>Revogar o consentimento a qualquer momento.</li>
          <li>Solicitar a portabilidade dos seus dados.</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-2">7. Uso da Localização</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sua localização GPS é coletada apenas quando você está utilizando o aplicativo ativamente. 
          Utilizamos a localização para encontrar motoristas próximos, calcular rotas e estimar 
          o tempo de chegada. Você pode revogar a permissão de localização a qualquer momento 
          nas configurações do seu dispositivo.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">8. Exclusão de Conta</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Você pode solicitar a exclusão da sua conta a qualquer momento através das configurações 
          do aplicativo. Ao excluir sua conta, todos os seus dados pessoais, histórico de corridas 
          e informações associadas serão permanentemente removidos dos nossos servidores.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">9. Alterações nesta Política</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
          através do aplicativo ou por e-mail.
        </p>

        <h2 className="text-base font-bold mt-6 mb-2">10. Contato</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para dúvidas sobre privacidade ou exercer seus direitos, entre em contato:
        </p>
        <p className="text-sm text-primary font-medium mt-1">
          📧 contato@f1driver.com.br
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
