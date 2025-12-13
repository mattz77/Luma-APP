import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, DollarSign, CheckSquare, Users, ShieldCheck, Lock, Bot, Lightbulb, Key } from 'lucide-react-native';
import { router } from 'expo-router';
import { cardShadowStyle } from '@/lib/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cores da marca Luma
const colors = {
  primary: {
    50: '#f0faff',
    100: '#e0f5ff',
    200: '#b9eaff',
    300: '#7ddfff',
    400: '#3acfff',
    500: '#0fb2ff',
    600: '#008bff',
    700: '#0070ff',
    800: '#0058c7',
    900: '#004c9f',
    950: '#002f63',
  },
  secondary: {
    50: '#f7f7f8',
    100: '#eceef0',
    200: '#d9dde2',
    300: '#c0c6ce',
    400: '#a3acb9',
    500: '#8c95a5',
    600: '#788191',
    700: '#687081',
    800: '#59606d',
    900: '#4f5560',
    950: '#31353b',
  },
};

export default function LandingPage() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = () => {
    // TODO: Implementar lógica de inscrição
    console.log('Email inscrito:', email);
    // Redirecionar para registro ou mostrar feedback
    router.push('/(auth)/register');
  };

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleViewFeatures = () => {
    // Scroll para seção de features (implementar se necessário)
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Sparkles size={28} color={colors.primary[700]} />
              <Text style={styles.logoText}>Luma</Text>
            </View>
            <Pressable
              style={styles.headerButton}
              onPress={handleGetStarted}
              android_ripple={{ color: colors.primary[800] }}
            >
              <Text style={styles.headerButtonText}>Acesso Antecipado</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            A sua casa, finalmente{' '}
            <Text style={styles.heroTitleAccent}>organizada</Text>.
          </Text>
          <Text style={styles.heroSubtitle}>
            Conheça Luma. A inteligência artificial que centraliza finanças, tarefas e a rotina da sua família em um só lugar.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable
              style={styles.primaryButton}
              onPress={handleGetStarted}
              android_ripple={{ color: colors.primary[800] }}
            >
              <Text style={styles.primaryButtonText}>Quero acesso antecipado</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={handleViewFeatures}
              android_ripple={{ color: colors.secondary[200] }}
            >
              <Text style={styles.secondaryButtonText}>Ver funcionalidades</Text>
            </Pressable>
          </View>

          {/* Phone Mockup */}
          <View style={styles.phoneMockupContainer}>
            <View style={styles.phoneMockup}>
              <View style={styles.phoneScreen}>
                <View style={styles.phoneHeader}>
                  <View style={styles.phoneAvatar}>
                    <Image
                      source={require('@/assets/illustrations/luma.png')}
                      style={styles.phoneAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View>
                    <Text style={styles.phoneHeaderName}>Luma</Text>
                    <Text style={styles.phoneHeaderStatus}>Online</Text>
                  </View>
                </View>
                <View style={styles.phoneMessages}>
                  <View style={styles.messageBubbleLeft}>
                    <Text style={styles.messageText}>
                      Olá! Como posso ajudar a organizar sua casa hoje?
                    </Text>
                  </View>
                  <View style={styles.messageBubbleRight}>
                    <Text style={styles.messageTextRight}>
                      Como está a situação financeira este mês?
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Chega de caos. Um app para tudo.</Text>
          <Text style={[styles.sectionSubtitle, { textAlign: 'center', alignSelf: 'center' }]}>
            Esqueça as planilhas, os blocos de notas e os grupos de WhatsApp. Luma é o único ponto de controle para a sua casa.
          </Text>

          <View style={styles.featuresGrid}>
            <View style={[styles.featureCard, cardShadowStyle]}>
              <View style={styles.featureIconContainer}>
                <DollarSign size={32} color={colors.primary[700]} />
              </View>
              <Text style={styles.featureTitle}>Gestão Financeira</Text>
              <Text style={styles.featureDescription}>
                Controle gastos, divida contas e veja relatórios inteligentes. Tudo com categorização automática por IA.
              </Text>
            </View>

            <View style={[styles.featureCard, cardShadowStyle]}>
              <View style={styles.featureIconContainer}>
                <CheckSquare size={32} color={colors.primary[700]} />
              </View>
              <Text style={styles.featureTitle}>Gestão de Tarefas</Text>
              <Text style={styles.featureDescription}>
                Organize a rotina da casa, atribua responsáveis e receba lembretes. Ninguém mais esquece de tirar o lixo.
              </Text>
            </View>

            <View style={[styles.featureCard, cardShadowStyle]}>
              <View style={styles.featureIconContainer}>
                <Users size={32} color={colors.primary[700]} />
              </View>
              <Text style={styles.featureTitle}>Colaboração Familiar</Text>
              <Text style={styles.featureDescription}>
                Controle quem vê o quê. Adicione responsáveis com acesso total ou membros (como filhos) que veem apenas tarefas e colaboração, sem acesso às finanças. Cada família decide o que compartilhar.
              </Text>
            </View>
          </View>
        </View>

        {/* Luma Assistant Section */}
        <View style={styles.lumaSection}>
          <View style={styles.lumaContent}>
            <View style={styles.lumaTextContainer}>
              <Text style={[styles.sectionTitle, { textAlign: 'left', marginBottom: 16 }]}>Converse com a sua casa.</Text>
              <Text style={[styles.sectionSubtitle, { textAlign: 'left', alignSelf: 'flex-start', marginBottom: 24 }]}>
                O coração do Luma é sua assistente de IA. Ela entende o contexto da sua casa, aprende com sua rotina e responde em linguagem natural.
              </Text>
              <View style={styles.lumaFeaturesList}>
                <View style={styles.lumaFeatureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                  <Text style={styles.lumaFeatureText}>
                    Analisa o contexto histórico da casa
                  </Text>
                </View>
                <View style={styles.lumaFeatureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                  <Text style={styles.lumaFeatureText}>
                    Cria tarefas e registra despesas por voz
                  </Text>
                </View>
                <View style={styles.lumaFeatureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                  <Text style={styles.lumaFeatureText}>
                    Sugestões proativas ("A conta de água está 30% acima do normal")
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.chatPreview, cardShadowStyle]}>
              <View style={styles.chatMessage}>
                <View style={styles.chatBubbleRight}>
                  <Text style={styles.chatMessageTextRight}>
                    Como está a situação financeira este mês?
                  </Text>
                </View>
              </View>
              <View style={styles.chatMessage}>
                <View style={styles.chatBubbleLeft}>
                  <Text style={styles.chatMessageTextLeft}>
                    Olá! 💰 Até agora vocês gastaram R$ 3.450 de um orçamento de R$ 4.000 (86%). As maiores despesas foram Aluguel (R$ 1.500) e Supermercado (R$ 980).
                  </Text>
                </View>
              </View>
              <View style={styles.chatMessage}>
                <View style={styles.chatBubbleRight}>
                  <Text style={styles.chatMessageTextRight}>
                    Quais as tarefas dessa semana?
                  </Text>
                </View>
              </View>
              <View style={styles.chatMessage}>
                <View style={styles.chatBubbleLeft}>
                  <Text style={styles.chatMessageTextLeft}>
                    Aqui estão: 📋 Fazer compras (João - Pendente, vence amanhã) e ⚠️ Pagar conta de luz (Você - Atrasada 2 dias).
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* IoT Future Section */}
        <View style={styles.iotSection}>
          <View style={styles.iotContent}>
            {SCREEN_WIDTH >= 768 ? (
              <>
                <View style={styles.iotTextContainer}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>EM BREVE</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Pronta para o futuro.</Text>
                  <Text style={styles.sectionSubtitle}>
                    Luma está sendo construída para ser o cérebro da sua casa conectada. Em breve, controle dispositivos IoT usando a mesma interface de chat.
                  </Text>
                  <View style={styles.quoteContainer}>
                    <Text style={styles.quoteText}>
                      "Luma, gostaria que você limpe o quarto."{'\n'}
                      "Entendido! Vou enviar o Roomba para limpar o quarto. Tempo estimado: 25 minutos. 🤖"
                    </Text>
                  </View>
                </View>
                <View style={styles.iotIconsContainer}>
                  <View style={[styles.iotIconCard, styles.iotIconCardSmall]}>
                    <Bot size={40} color={colors.primary[700]} />
                  </View>
                  <View style={[styles.iotIconCard, styles.iotIconCardLarge]}>
                    <Lightbulb size={48} color={colors.primary[700]} />
                  </View>
                  <View style={[styles.iotIconCard, styles.iotIconCardSmall]}>
                    <Key size={40} color={colors.primary[700]} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.iotIconsContainer}>
                  <View style={[styles.iotIconCard, styles.iotIconCardSmall]}>
                    <Bot size={40} color={colors.primary[700]} />
                  </View>
                  <View style={[styles.iotIconCard, styles.iotIconCardLarge]}>
                    <Lightbulb size={48} color={colors.primary[700]} />
                  </View>
                  <View style={[styles.iotIconCard, styles.iotIconCardSmall]}>
                    <Key size={40} color={colors.primary[700]} />
                  </View>
                </View>
                <View style={styles.iotTextContainer}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>EM BREVE</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Pronta para o futuro.</Text>
                  <Text style={styles.sectionSubtitle}>
                    Luma está sendo construída para ser o cérebro da sua casa conectada. Em breve, controle dispositivos IoT usando a mesma interface de chat.
                  </Text>
                  <View style={styles.quoteContainer}>
                    <Text style={styles.quoteText}>
                      "Luma, gostaria que você limpe o quarto."{'\n'}
                      "Entendido! Vou enviar o Roomba para limpar o quarto. Tempo estimado: 25 minutos. 🤖"
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Sua casa, seus dados.</Text>
          <Text style={[styles.sectionSubtitle, { textAlign: 'center', alignSelf: 'center' }]}>
            Privacidade não é um "extra", é a fundação. Usamos a melhor tecnologia para garantir que seus dados sejam apenas seus.
          </Text>

          <View style={styles.securityGrid}>
            <View style={styles.securityItem}>
              <View style={styles.securityIconContainer}>
                <ShieldCheck size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.securityTitle}>Privacidade Total</Text>
              <Text style={styles.securityDescription}>
                Cada família só acessa seus próprios dados. Suas informações financeiras, tarefas e conversas são completamente isoladas e visíveis apenas para quem você convidar para sua casa.
              </Text>
            </View>

            <View style={styles.securityItem}>
              <View style={styles.securityIconContainer}>
                <Lock size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.securityTitle}>Proteção de Dados</Text>
              <Text style={styles.securityDescription}>
                Seus dados são protegidos com os mais altos padrões de segurança. Estamos em total conformidade com a LGPD, garantindo que suas informações pessoais e financeiras estejam sempre seguras.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Junte-se à revolução da gestão doméstica.</Text>
          <Text style={styles.ctaSubtitle}>
            Deixe a inteligência artificial cuidar da organização para que você possa focar no que realmente importa. Inscreva-se para o acesso antecipado.
          </Text>
          <View style={styles.ctaForm}>
            <TextInput
              style={styles.emailInput}
              placeholder="seu.email@familia.com"
              placeholderTextColor={colors.secondary[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.ctaButton}
              onPress={handleEmailSubmit}
              android_ripple={{ color: colors.secondary[800] }}
            >
              <Text style={styles.ctaButtonText}>Participar</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLogo}>
              <Sparkles size={24} color={colors.primary[700]} />
              <Text style={styles.footerLogoText}>Luma</Text>
            </View>
            <Text style={styles.footerCopyright}>
              © 2025 Luma. Todos os direitos reservados.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary[50],
  },
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
    maxWidth: '100%',
  },
  header: {
    backgroundColor: Platform.select({
      web: `${colors.secondary[50]}CC`,
      default: colors.secondary[50],
    }),
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary[900],
    letterSpacing: -0.5,
  },
  headerButton: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 112, 255, 0.3)',
      },
      default: {
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
  },
  heroTitle: {
    fontSize: SCREEN_WIDTH < 768 ? 36 : 56,
    fontWeight: '800',
    color: colors.secondary[900],
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: SCREEN_WIDTH < 768 ? 44 : 64,
  },
  heroTitleAccent: {
    color: colors.primary[700],
  },
  heroSubtitle: {
    marginTop: 24,
    fontSize: SCREEN_WIDTH < 768 ? 16 : 20,
    color: colors.secondary[600],
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
  },
  heroButtons: {
    marginTop: 40,
    flexDirection: SCREEN_WIDTH < 768 ? 'column' : 'row',
    gap: 16,
    width: '100%',
    maxWidth: 600,
  },
  primaryButton: {
    flex: SCREEN_WIDTH < 768 ? 0 : 1,
    backgroundColor: colors.primary[700],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 112, 255, 0.4)',
      },
      default: {
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: SCREEN_WIDTH < 768 ? 0 : 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary[100],
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  secondaryButtonText: {
    color: colors.secondary[700],
    fontSize: 18,
    fontWeight: '700',
  },
  phoneMockupContainer: {
    marginTop: 64,
    alignItems: 'center',
  },
  phoneMockup: {
    width: 280,
    height: 560,
    backgroundColor: '#1a1a1a',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#333',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
        transform: 'rotate(-3deg)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[100],
  },
  phoneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  phoneAvatarImage: {
    width: '100%',
    height: '100%',
  },
  phoneHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary[900],
  },
  phoneHeaderStatus: {
    fontSize: 12,
    color: colors.secondary[500],
  },
  phoneMessages: {
    flex: 1,
    gap: 12,
    marginTop: 16,
  },
  messageBubbleLeft: {
    backgroundColor: colors.secondary[100],
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageBubbleRight: {
    backgroundColor: colors.primary[700],
    padding: 12,
    borderRadius: 16,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: colors.secondary[800],
  },
  messageTextRight: {
    fontSize: 14,
    color: '#fff',
  },
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH < 768 ? 28 : 36,
    fontWeight: '800',
    color: colors.secondary[900],
    textAlign: SCREEN_WIDTH < 768 ? 'center' : 'left',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: colors.secondary[600],
    textAlign: SCREEN_WIDTH < 768 ? 'center' : 'left',
    maxWidth: 600,
    alignSelf: SCREEN_WIDTH < 768 ? 'center' : 'flex-start',
    lineHeight: 28,
    marginBottom: 64,
  },
  featuresGrid: {
    flexDirection: SCREEN_WIDTH < 768 ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    gap: 24,
    borderWidth: 1,
    borderColor: colors.primary[100],
    flex: SCREEN_WIDTH < 768 ? 1 : 1,
    minWidth: SCREEN_WIDTH < 768 ? '100%' : 280,
    maxWidth: SCREEN_WIDTH < 768 ? '100%' : 400,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary[100],
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.secondary[900],
  },
  featureDescription: {
    fontSize: 16,
    color: colors.secondary[600],
    lineHeight: 24,
  },
  lumaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: colors.secondary[100],
    width: '100%',
  },
  lumaContent: {
    flexDirection: SCREEN_WIDTH < 768 ? 'column' : 'row',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 48,
    alignItems: 'flex-start',
    paddingHorizontal: SCREEN_WIDTH < 768 ? 0 : 16,
  },
  lumaTextContainer: {
    gap: 16,
    flex: 1,
    minWidth: 0, // Permite que o flex funcione corretamente
  },
  lumaFeaturesList: {
    marginTop: 24,
    gap: 12,
  },
  lumaFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  lumaFeatureText: {
    flex: 1,
    fontSize: 16,
    color: colors.secondary[700],
    lineHeight: 24,
  },
  chatPreview: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    flex: 1,
    minWidth: 0, // Permite que o flex funcione corretamente
    maxWidth: SCREEN_WIDTH < 768 ? '100%' : 500,
    alignSelf: SCREEN_WIDTH < 768 ? 'stretch' : 'flex-start',
  },
  chatMessage: {
    gap: 8,
  },
  chatBubbleLeft: {
    backgroundColor: colors.secondary[100],
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  chatBubbleRight: {
    backgroundColor: colors.primary[700],
    padding: 16,
    borderRadius: 20,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  chatMessageTextLeft: {
    fontSize: 14,
    color: colors.secondary[800],
    lineHeight: 20,
    flexShrink: 1,
  },
  chatMessageTextRight: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    flexShrink: 1,
  },
  iotSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  iotContent: {
    flexDirection: SCREEN_WIDTH < 768 ? 'column' : 'row',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 48,
    alignItems: 'center',
  },
  iotIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  iotIconCard: {
    backgroundColor: colors.secondary[100],
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  iotIconCardSmall: {
    width: 96,
    height: 96,
  },
  iotIconCardLarge: {
    width: 128,
    height: 128,
  },
  iotTextContainer: {
    gap: 16,
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primary[700],
    fontSize: 14,
    fontWeight: '600',
  },
  quoteContainer: {
    marginTop: 24,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[700],
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.secondary[700],
    lineHeight: 24,
  },
  securitySection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  securityGrid: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    gap: 32,
    marginTop: 64,
  },
  securityItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  securityIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary[900],
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 16,
    color: colors.secondary[600],
    lineHeight: 24,
    flex: 1,
  },
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: colors.primary[700],
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: SCREEN_WIDTH < 768 ? 28 : 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: colors.primary[100],
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
    marginBottom: 40,
  },
  ctaForm: {
    width: '100%',
    maxWidth: 500,
    flexDirection: SCREEN_WIDTH < 768 ? 'column' : 'row',
    gap: 12,
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    fontSize: 16,
    color: colors.secondary[900],
  },
  ctaButton: {
    backgroundColor: colors.secondary[900],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH < 768 ? '100%' : 140,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.secondary[100],
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.secondary[900],
  },
  footerCopyright: {
    fontSize: 14,
    color: colors.secondary[500],
    textAlign: 'center',
  },
});

