import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, TouchableOpacity, View, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../../firebaseConfig.js';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    if (route === '/login') {
      router.push('/login');
    } else if (route === '/register') {
      router.push('/register');
    } else if (route === '/explore') {
      router.push('/explore');
    }
  };

    return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image Section */}
      <View style={styles.heroSection}>
        <ImageBackground
          source={require('../../assets/images/medicina.jpeg')}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          <View style={styles.heroOverlay}>
            {/* Header inside hero */}
            <View style={styles.heroHeader}>
              <View style={styles.heroHeaderContent}>
                <MaterialCommunityIcons name="heart-pulse" size={32} color="white" />
                <View style={styles.heroHeaderText}>
                  <ThemedText type="title" style={styles.heroWelcomeTitle}>
                    Pulsoft
                  </ThemedText>
                  <ThemedText style={styles.heroWelcomeSubtitle}>
                    Monitoreo de salud inteligente
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <View style={styles.heroContent}>
              <ThemedText style={styles.heroLabel}>SALUD & BIENESTAR</ThemedText>
              <ThemedText type="title" style={styles.heroTitle}>
                Descubre tu salud{'\n'}en tiempo real
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Monitoreo inteligente con tecnología de vanguardia para cuidar de ti
              </ThemedText>
              <View style={styles.heroButtons}>
                <TouchableOpacity 
                  style={styles.heroButton}
                  onPress={() => handleNavigation('/login')}
                >
                  <ThemedText style={styles.heroButtonText}>Iniciar Sesión</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.heroButton, styles.secondaryHeroButton]}
                  onPress={() => handleNavigation('/register')}
                >
                  <ThemedText style={[styles.heroButtonText, styles.secondaryHeroButtonText]}>
                    Crear Cuenta
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Features Section */}
      <View style={styles.featuresContainer}>
        <ThemedText type="title" style={styles.sectionTitle}>
          ¿Por qué elegir Pulsoft?
        </ThemedText>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="heart-pulse" size={40} color="#FF6B6B" />
            <ThemedText style={styles.featureTitle}>Monitoreo Cardiovascular</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Seguimiento en tiempo real de tu ritmo cardíaco y actividad cardiovascular
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="water" size={40} color="#4BC0C0" />
            <ThemedText style={styles.featureTitle}>Análisis de Sudor</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Monitoreo de GSR para evaluar niveles de estrés y hidratación
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="thermometer" size={40} color="#FFCD56" />
            <ThemedText style={styles.featureTitle}>Control de Temperatura</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Seguimiento preciso de la temperatura corporal
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="brain" size={40} color="#9C27B0" />
            <ThemedText style={styles.featureTitle}>IA Inteligente</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Análisis avanzado con inteligencia artificial para recomendaciones personalizadas
            </ThemedText>
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howItWorksContainer}>
        <ThemedText type="title" style={styles.sectionTitle}>
          ¿Cómo funciona?
        </ThemedText>
        
        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Conecta tu dispositivo</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Conecta tus sensores biométricos a la aplicación
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Monitorea en tiempo real</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Visualiza tus datos biométricos en gráficas interactivas
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Recibe análisis IA</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Obtén recomendaciones personalizadas basadas en tus datos
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaContainer}>
        <ThemedText type="title" style={styles.ctaTitle}>
          ¿Listo para comenzar?
        </ThemedText>
        <ThemedText style={styles.ctaSubtitle}>
          Únete a miles de usuarios que ya confían en Pulsoft para su salud
        </ThemedText>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => handleNavigation('/register')}
        >
          <ThemedText style={styles.ctaButtonText}>Comenzar Ahora</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Pulsoft - Monitoreo de salud inteligente
        </ThemedText>
        <ThemedText style={styles.footerVersion}>
          Versión 1.0.0
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0A7EA4',
    marginTop: 16,
    fontFamily: 'Lufga-Bold',
  },
  appSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Lufga-Regular',
  },
  authButtons: {
    width: '100%',
    gap: 16,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Lufga-Bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0A7EA4',
  },
  secondaryButtonText: {
    color: '#0A7EA4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Lufga-Bold',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Lufga-Regular',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
     sectionTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 16,
     fontFamily: 'Lufga-Bold',
   },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    fontFamily: 'Lufga-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Lufga-Regular',
  },
  navigationContainer: {
    padding: 20,
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  navCard: {
    width: (screenWidth - 72) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  navCardContent: {
    padding: 20,
    alignItems: 'center',
  },
     navCardTitle: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333',
     marginTop: 12,
     textAlign: 'center',
     fontFamily: 'Lufga-Bold',
   },
   navCardSubtitle: {
     fontSize: 12,
     color: '#666',
     marginTop: 4,
     textAlign: 'center',
     fontFamily: 'Lufga-Regular',
   },
     heroSection: {
     height: 500,
     margin: 0,
     borderRadius: 0,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.3,
     shadowRadius: 16,
     elevation: 8,
   },
   heroBackground: {
     flex: 1,
     justifyContent: 'center',
   },
   heroBackgroundImage: {
     borderRadius: 0,
   },
   heroOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.4)',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 40,
   },
   heroHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     width: '100%',
     paddingTop: 20,
   },
   heroHeaderContent: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   heroHeaderText: {
     marginLeft: 12,
   },
   heroWelcomeTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: 'white',
     fontFamily: 'Lufga-Bold',
   },
   heroWelcomeSubtitle: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.8)',
     marginTop: 2,
     fontFamily: 'Lufga-Regular',
   },
   heroLogoutButton: {
     padding: 8,
   },
   heroContent: {
     alignItems: 'center',
     maxWidth: 300,
   },
   heroLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: '#0A7EA4',
     backgroundColor: 'rgba(255, 255, 255, 0.9)',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 20,
     marginBottom: 16,
     textAlign: 'center',
     fontFamily: 'Lufga-Bold',
   },
   heroTitle: {
     fontSize: 32,
     fontWeight: 'bold',
     color: 'white',
     textAlign: 'center',
     marginBottom: 16,
     fontFamily: 'Lufga-Bold',
     lineHeight: 40,
   },
   heroSubtitle: {
     fontSize: 16,
     color: 'rgba(255, 255, 255, 0.9)',
     textAlign: 'center',
     lineHeight: 24,
     fontFamily: 'Lufga-Regular',
     marginBottom: 24,
   },
   heroButton: {
     backgroundColor: '#0A7EA4',
     paddingHorizontal: 32,
     paddingVertical: 16,
     borderRadius: 30,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 4,
   },
   heroButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: 'bold',
     fontFamily: 'Lufga-Bold',
   },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Lufga-Regular',
  },
  footerVersion: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Lufga-Regular',
  },
  // Hero buttons
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  secondaryHeroButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  secondaryHeroButtonText: {
    color: 'white',
  },
  // Features section
  featuresContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  featuresGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Lufga-Bold',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Lufga-Regular',
  },
  // How it works section
  howItWorksContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  stepsContainer: {
    gap: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A7EA4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Lufga-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Lufga-Bold',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Lufga-Regular',
  },
  // CTA section
  ctaContainer: {
    padding: 40,
    backgroundColor: '#0A7EA4',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Lufga-Bold',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Lufga-Regular',
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#0A7EA4',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lufga-Bold',
  },
});
