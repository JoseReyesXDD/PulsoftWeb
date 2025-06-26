import React from "react";
import { Image } from 'expo-image';

const GlobalStyles = ({
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    content: {
      marginTop: 6,
      marginLeft: 24,
    },
    text: {
      fontSize: 28,
      lineHeight: 32,
      marginTop: -6,
      fontFamily: 'Lufga',
    },
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
      fontFamily: 'Lufga',
      },
    description: {
      color: '#34495E',
      fontSize: 14,
      opacity: 0.8,
      fontFamily: 'Lufga',
      },
  });