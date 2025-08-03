import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface WebViewTemplateProps {
  templateName: string;
  data?: any;
  style?: any;
}

const WebViewTemplate = ({ templateName, data = {}, style }: WebViewTemplateProps) => {
  // Función para cargar el contenido HTML del template
  const loadTemplate = (template: string) => {
    switch (template) {
      case 'login':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .login-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .form-group {
                margin-bottom: 20px;
              }
              label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
              }
              input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
              }
              button {
                width: 100%;
                padding: 12px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
              }
              button:hover {
                background: #0056b3;
              }
            </style>
          </head>
          <body>
            <div class="login-container">
              <h2>Iniciar Sesión</h2>
              <form>
                <div class="form-group">
                  <label for="email">Correo Electrónico:</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                  <label for="password">Contraseña:</label>
                  <input type="password" id="password" name="password" required>
                </div>
                <button type="submit">Iniciar Sesión</button>
              </form>
            </div>
          </body>
          </html>
        `;
      
      case 'patient_dashboard':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .dashboard {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .metric {
                display: inline-block;
                margin: 10px;
                padding: 20px;
                background: #e3f2fd;
                border-radius: 8px;
                text-align: center;
                min-width: 120px;
              }
              .metric-value {
                font-size: 24px;
                font-weight: bold;
                color: #1976d2;
              }
            </style>
          </head>
          <body>
            <div class="dashboard">
              <h2>Panel del Paciente</h2>
              <div class="metric">
                <div class="metric-value">${data.cardiovascular || 0}</div>
                <div>Cardiovascular</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.sudor || 0}</div>
                <div>Sudor</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.temperatura || 0}°C</div>
                <div>Temperatura</div>
              </div>
            </div>
          </body>
          </html>
        `;
      
      case 'caregiver_dashboard':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .dashboard {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .patient-list {
                margin-top: 20px;
              }
              .patient-item {
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                margin-bottom: 10px;
                background: #f9f9f9;
              }
            </style>
          </head>
          <body>
            <div class="dashboard">
              <h2>Panel del Cuidador</h2>
              <div class="patient-list">
                <div class="patient-item">
                  <h3>Paciente 1</h3>
                  <p>Estado: Estable</p>
                  <p>Última actualización: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      
      default:
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Template: ${templateName}</h2>
              <p>Este template no está implementado aún.</p>
            </div>
          </body>
          </html>
        `;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: loadTemplate(templateName) }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewTemplate; 