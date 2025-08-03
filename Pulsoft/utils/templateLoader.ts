import { Asset } from 'expo-asset';

export interface TemplateData {
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
  [key: string]: any;
}

export class TemplateLoader {
  private static templates: { [key: string]: string } = {};

  // Función para cargar un template HTML
  static async loadTemplate(templateName: string): Promise<string> {
    try {
      // Si ya tenemos el template en caché, lo devolvemos
      if (this.templates[templateName]) {
        return this.templates[templateName];
      }

      // Intentar cargar el archivo HTML
      const asset = Asset.fromModule(require(`../../templates/${templateName}.html`));
      await asset.downloadAsync();
      
      const response = await fetch(asset.uri);
      const html = await response.text();
      
      // Guardar en caché
      this.templates[templateName] = html;
      
      return html;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName);
    }
  }

  // Función para renderizar un template con datos
  static renderTemplate(templateName: string, data: TemplateData = {}): string {
    const template = this.templates[templateName] || this.getDefaultTemplate(templateName);
    
    // Reemplazar variables en el template
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  // Template por defecto si no se puede cargar el archivo
  private static getDefaultTemplate(templateName: string): string {
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
          <p>No se pudo cargar el template ${templateName}.html</p>
        </div>
      </body>
      </html>
    `;
  }

  // Función para precargar todos los templates
  static async preloadTemplates(templateNames: string[]): Promise<void> {
    const promises = templateNames.map(name => this.loadTemplate(name));
    await Promise.all(promises);
  }
} 