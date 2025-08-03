import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WebViewTemplate from '@/components/WebViewTemplate';

export default function TemplateExampleScreen() {
  const [currentTemplate, setCurrentTemplate] = useState('login');
  const [templateData, setTemplateData] = useState({
    cardiovascular: 75,
    sudor: 45,
    temperatura: 37.2
  });

  const templates = [
    { name: 'login', title: 'Login' },
    { name: 'patient_dashboard', title: 'Panel del Paciente' },
    { name: 'caregiver_dashboard', title: 'Panel del Cuidador' }
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Templates HTML
      </ThemedText>
      
      {/* Selector de templates */}
      <ScrollView horizontal style={styles.templateSelector}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.name}
            style={[
              styles.templateButton,
              currentTemplate === template.name && styles.activeButton
            ]}
            onPress={() => setCurrentTemplate(template.name)}
          >
            <ThemedText style={[
              styles.buttonText,
              currentTemplate === template.name && styles.activeButtonText
            ]}>
              {template.title}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contenedor del template */}
      <View style={styles.templateContainer}>
        <WebViewTemplate
          templateName={currentTemplate}
          data={templateData}
          style={styles.webview}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  templateSelector: {
    marginBottom: 20,
  },
  templateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: 'white',
  },
  templateContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
}); 