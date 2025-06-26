import { StyleSheet, ScrollView, Dimensions } from 'react-native';

import { ImageCarousel } from '@/components/ImageCarousel';
import { ImageGrid } from '@/components/ImageGrid';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const screenWidth = Dimensions.get('window').width;

export default function TabOneScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F8F9FA', dark: '#1D3D47' }}
      headerImage={
        <ImageCarousel />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Bienvenido a Pulsoft
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Innovación en tecnología para la salud mental
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Nuestra Misión
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Desarrollamos soluciones tecnológicas innovadoras para la prevención y atención de la ansiedad, 
            combinando sensores biométricos, inteligencia artificial y análisis de datos en tiempo real.
          </ThemedText>
        </ThemedView>

        <ImageGrid />

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            ¿Por qué elegirnos?
          </ThemedText>
          <ThemedView style={styles.featureList}>
            <ThemedView style={styles.featureItem}>
              <ThemedText style={styles.featureTitle}>Tecnología de Vanguardia</ThemedText>
              <ThemedText style={styles.featureText}>
                Implementamos las últimas innovaciones en IoT, IA y análisis de datos
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.featureItem}>
              <ThemedText style={styles.featureTitle}>Enfoque Preventivo</ThemedText>
              <ThemedText style={styles.featureText}>
                Detección temprana y alertas proactivas para prevenir crisis
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.featureItem}>
              <ThemedText style={styles.featureTitle}>Privacidad Garantizada</ThemedText>
              <ThemedText style={styles.featureText}>
                Protección total de datos y control del usuario sobre su información
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Contacto
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            ¿Interesado en nuestra solución? Contáctanos para más información
          </ThemedText>
          <ThemedText style={styles.contactInfo}>
            Email: contacto@pulsoft.com{'\n'}
            Teléfono: (123) 456-7890
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2C3E50',
    textAlign: 'center',
    fontFamily: 'Gabarito',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#34495E',
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: 'Gabarito',
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#2C3E50',
    fontFamily: 'Gabarito',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495E',
    opacity: 0.8,
    fontFamily: 'Gabarito',
  },
  featureList: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  featureItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: 'transparent',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#2C3E50',
    fontFamily: 'Gabarito',
  },
  featureText: {
    fontSize: 12,
    color: '#34495E',
    opacity: 0.8,
    fontFamily: 'Gabarito',
  },
  contactInfo: {
    fontSize: 14,
    color: '#34495E',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'Gabarito',
  },
  button: {
    width: '80%',
    alignSelf: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2C3E50',
    marginVertical: 8,
  },
  roleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A7EA4',
    shadowColor: '#0A7EA4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
});
