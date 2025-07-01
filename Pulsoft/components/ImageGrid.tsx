import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { ImageCard } from './ImageCard';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 2 * 3 - 32) / 3; // 32 = padding horizontal del grid

const locations = [
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Monitoreo Biométrico',
    description: 'Sensores IoT para seguimiento en tiempo real de indicadores de ansiedad',
  },
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Inteligencia Artificial',
    description: 'Predicción y alertas tempranas mediante análisis de datos',
  },
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Plataforma Cloud',
    description: 'Almacenamiento seguro y análisis de datos biométricos',
  },
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Aplicaciones Móvil/Web',
    description: 'Interfaz intuitiva para pacientes y profesionales de la salud',
  },
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Soporte 24/7',
    description: 'Atención y soporte técnico en todo momento',
  },
  {
    image: require('@/assets/images/partial-react-logo.png'),
    title: 'Privacidad y Seguridad',
    description: 'Protección avanzada de datos y privacidad del usuario',
  },
];

export function ImageGrid() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Solución Integral
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Tecnología 4.0 para la prevención y atención de la ansiedad
        </ThemedText>
      </View>
      <View style={styles.grid}>
        {locations.map((location, index) => (
          <View
            key={index}
            style={styles.cardContainer}
          >
            <ImageCard
              image={location.image}
              title={location.title}
              description={location.description}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#34495E',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  cardContainer: {
    flexBasis: '32%',
    maxWidth: '32%',
    margin: CARD_MARGIN,
  },
}); 