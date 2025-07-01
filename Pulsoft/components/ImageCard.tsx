import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

type ImageCardProps = {
  image: any;
  title: string;
  description: string;
  onPress?: () => void;
};

export function ImageCard({ image, title, description, onPress }: ImageCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} contentFit="cover" />
        <View style={styles.overlay} />
      </View>
      <View style={styles.contentContainer}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
          <IconSymbol name="chevron.right" size={16} color="#2C3E50" />
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    height: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageContainer: {
    position: 'relative',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  title: {
    color: '#2C3E50',
    fontSize: 18,
    marginBottom: 6,
    fontWeight: '600',
  },
  description: {
    color: '#34495E',
    fontSize: 14,
    opacity: 0.8,
  },
}); 