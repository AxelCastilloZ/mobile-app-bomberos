import { Platform } from 'react-native';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

class ApiService {
  private config: ApiConfig;
  private authToken: string | null = null;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    console.log('API: Token establecido');
  }

  removeAuthToken(): void {
    this.authToken = null;
    console.log('API: Token removido');
  }

  updateBaseURL(newBaseURL: string): void {
    this.config.baseURL = newBaseURL;
    console.log('API: URL actualizada a:', newBaseURL);
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    options?: { timeout?: number; retries?: number }
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const retries = options?.retries ?? this.config.retries;
    const timeout = options?.timeout ?? this.config.timeout;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`API: ${method} ${endpoint} (intento ${attempt + 1}/${retries + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers: this.getHeaders(),
          signal: controller.signal,
        };

        if (data && method !== 'GET') {
          requestOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        console.log(`API: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await response.json() as T;
          }
          return {} as T;
        }

        if (response.status === 401) {
          throw new Error('No autorizado - credenciales inválidas');
        }

        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `${response.status}: ${response.statusText}`;
        }

        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMessage);
        }

        lastError = new Error(errorMessage);

        if (attempt < retries) {
          console.log(`API: Reintentando en ${this.config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        console.error(`API: Error en intento ${attempt + 1}:`, lastError.message);

        if (
          lastError.message.includes('401') ||
          lastError.message.includes('400') ||
          lastError.message.includes('No autorizado')
        ) break;

        if (
          attempt < retries &&
          (lastError.name === 'AbortError' ||
           lastError.message.includes('Network request failed') ||
           lastError.message.includes('fetch'))
        ) {
          console.log(`API: Error de red, reintentando en ${this.config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        } else if (attempt >= retries) {
          break;
        }
      }
    }

    throw lastError || new Error('Todos los intentos fallaron');
  }

  async get<T>(endpoint: string, options?: { timeout?: number; retries?: number }): Promise<T> {
    return this.makeRequest<T>(endpoint, 'GET', undefined, options);
  }
  async post<T>(endpoint: string, data?: any, options?: { timeout?: number; retries?: number }): Promise<T> {
    return this.makeRequest<T>(endpoint, 'POST', data, options);
  }
  async put<T>(endpoint: string, data?: any, options?: { timeout?: number; retries?: number }): Promise<T> {
    return this.makeRequest<T>(endpoint, 'PUT', data, options);
  }
  async patch<T>(endpoint: string, data?: any, options?: { timeout?: number; retries?: number }): Promise<T> {
    return this.makeRequest<T>(endpoint, 'PATCH', data, options);
  }
  async delete<T>(endpoint: string, options?: { timeout?: number; retries?: number }): Promise<T> {
    return this.makeRequest<T>(endpoint, 'DELETE', undefined, options);
  }

  async isServerAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.config.baseURL, { method: 'HEAD', signal: controller.signal });

      clearTimeout(timeoutId);
      return response.status >= 200 && response.status < 600;
    } catch (error) {
      console.log('API: Servidor no disponible:', error);
      return false;
    }
  }

  async autoDetectServer(): Promise<string | null> {
    const envCandidates = (process.env.EXPO_PUBLIC_SERVER_CANDIDATES || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // ← SIN IPs hardcodeadas: solo usa lo que venga de .env
    const possibleUrls = [...envCandidates];

    console.log('API: Buscando servidor disponible...');

    for (const url of possibleUrls) {
      try {
        console.log(`API: Probando ${url}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.status >= 200 && response.status < 600) {
          console.log(`API: Servidor encontrado en ${url}`);
          return url;
        }
      } catch {
        console.log(`API: ${url} no disponible`);
        continue;
      }
    }

    console.log('API: No se encontró servidor disponible');
    return null;
  }

  async initialize(): Promise<boolean> {
    console.log('API: Inicializando...');
    const isAvailable = await this.isServerAvailable();

    if (isAvailable) {
      console.log('API: Servidor disponible en URL configurada');
      return true;
    }

    console.log('API: URL configurada no disponible, buscando servidor...');
    const detectedUrl = await this.autoDetectServer();

    if (detectedUrl) {
      this.updateBaseURL(detectedUrl);
      return true;
    }

    console.warn('API: No se pudo conectar a ningún servidor');
    return false;
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<{
    available: boolean;
    url: string;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const available = await this.isServerAvailable();
      const responseTime = Date.now() - startTime;
      return { available, url: this.config.baseURL, responseTime: available ? responseTime : undefined };
    } catch (error) {
      return {
        available: false,
        url: this.config.baseURL,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}


const defaultConfig: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  timeout: Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT ?? 15000),
  retries: Number(process.env.EXPO_PUBLIC_RETRY_ATTEMPTS ?? 2),
  retryDelay: Number(process.env.EXPO_PUBLIC_RETRY_DELAY ?? 1000),
};


if (defaultConfig.baseURL && defaultConfig.baseURL.endsWith('/api')) {
  defaultConfig.baseURL = defaultConfig.baseURL.slice(0, -4);
}

export const apiService = new ApiService(defaultConfig);
