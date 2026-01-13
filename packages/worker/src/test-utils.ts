/**
 * Test utilities and mocks for worker package tests
 */

/**
 * Create a mock File with slice support
 */
export function createMockFile(
  name: string,
  size: number,
  data?: Uint8Array
): File {
  const fileData = data || new Uint8Array(size).fill(0);
  
  const file = new File([fileData], name, { type: "application/octet-stream" });
  
  // Ensure file has correct size
  Object.defineProperty(file, "size", {
    value: size,
    writable: false,
  });

  return file;
}

/**
 * Create a mock FileSystemFileHandle
 */
export function createMockFileHandle(
  name: string,
  size: number,
  data?: Uint8Array
): FileSystemFileHandle {
  const file = createMockFile(name, size, data);
  
  const handle = {
    name,
    kind: "file" as const,
    async getFile(): Promise<File> {
      return file;
    },
    async createWritable(): Promise<FileSystemWritableFileStream> {
      throw new Error("Not implemented in mock");
    },
    async isSameEntry(other: FileSystemHandle): Promise<boolean> {
      return other === handle;
    },
    async queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState> {
      return "granted";
    },
    async requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState> {
      return "granted";
    },
    remove(): Promise<void> {
      throw new Error("Not implemented in mock");
    },
  } as FileSystemFileHandle;

  return handle;
}

/**
 * Create a mock MessagePort
 */
export function createMockMessagePort(): {
  port: MessagePort;
  messages: Array<{ data: any; transfer?: Transferable[] }>;
  sendMessage: (data: any, transfer?: Transferable[]) => void;
  simulateMessage: (data: any) => void;
} {
  const messages: Array<{ data: any; transfer?: Transferable[] }> = [];
  let onMessageHandler: ((event: MessageEvent) => void) | null = null;
  let onErrorHandler: ((event: ErrorEvent) => void) | null = null;
  let started = false;

  const port = {
    postMessage(data: any, transfer?: Transferable[]): void {
      messages.push({ data, transfer });
    },
    start(): void {
      started = true;
    },
    close(): void {
      started = false;
      onMessageHandler = null;
      onErrorHandler = null;
    },
    get onmessage() {
      return onMessageHandler;
    },
    set onmessage(handler: ((event: MessageEvent) => void) | null) {
      onMessageHandler = handler;
    },
    get onerror() {
      return onErrorHandler;
    },
    set onerror(handler: ((event: ErrorEvent) => void) | null) {
      onErrorHandler = handler;
    },
    addEventListener(): void {},
    removeEventListener(): void {},
    dispatchEvent(): boolean {
      return true;
    },
  } as unknown as MessagePort;

  return {
    port,
    messages,
    sendMessage: (data: any, transfer?: Transferable[]) => {
      port.postMessage(data, transfer);
    },
    simulateMessage: (data: any) => {
      if (onMessageHandler) {
        const event = new MessageEvent("message", { data });
        onMessageHandler(event);
      }
    },
  };
}

/**
 * Create a mock SharedWorker (kept for backward compatibility)
 */
export function createMockSharedWorker(
  url: string | URL
): {
  worker: SharedWorker;
  ports: Array<ReturnType<typeof createMockMessagePort>>;
  simulateConnect: () => ReturnType<typeof createMockMessagePort>;
} {
  const ports: Array<ReturnType<typeof createMockMessagePort>> = [];

  const worker = {
    port: null as MessagePort | null,
    onerror: null as ((event: ErrorEvent) => void) | null,
  } as unknown as SharedWorker;

  return {
    worker,
    ports,
    simulateConnect: () => {
      const mockPort = createMockMessagePort();
      ports.push(mockPort);
      worker.port = mockPort.port;
      return mockPort;
    },
  };
}

/**
 * Mock Service Worker client for testing
 */
export interface MockServiceWorkerClient {
  id: string;
  postMessage: (message: any, transfer?: Transferable[]) => void;
  messages: Array<{ data: any; transfer?: Transferable[] }>;
  simulateMessage: (data: any) => void;
}

/**
 * Create a mock Service Worker client
 */
export function createMockServiceWorkerClient(): MockServiceWorkerClient {
  const messages: Array<{ data: any; transfer?: Transferable[] }> = [];
  let onMessageHandler: ((event: MessageEvent) => void) | null = null;

  const client: MockServiceWorkerClient = {
    id: `client-${Math.random().toString(36).substr(2, 9)}`,
    messages,
    postMessage(data: any, transfer?: Transferable[]): void {
      messages.push({ data, transfer });
    },
    simulateMessage(data: any): void {
      if (onMessageHandler) {
        const event = new MessageEvent("message", { data });
        onMessageHandler(event);
      }
    },
  };

  return client;
}

/**
 * Create a mock Service Worker registration
 */
export function createMockServiceWorkerRegistration(): {
  registration: ServiceWorkerRegistration;
  clients: Map<string, MockServiceWorkerClient>;
  controller: ServiceWorker | null;
  simulateMessage: (clientId: string, data: any) => void;
  simulateClientMessage: (data: any) => void;
} {
  const clients = new Map<string, MockServiceWorkerClient>();
  let controller: ServiceWorker | null = null;
  let onMessageHandler: ((event: MessageEvent) => void) | null = null;

  const registration = {
    scope: "/",
    updateViaCache: "imports" as ServiceWorkerUpdateViaCache,
    installing: null as ServiceWorker | null,
    waiting: null as ServiceWorker | null,
    activating: null as ServiceWorker | null,
    active: null as ServiceWorker | null,
    navigationPreload: {
      enable: async () => {},
      disable: async () => {},
      setHeaderValue: async () => {},
      getState: async () => ({
        enabled: false,
        headerValue: "",
      }),
    },
    pushManager: {} as PushManager,
    sync: {} as SyncManager,
    update: async () => {},
    unregister: async () => true,
    getNotifications: async () => [],
    showNotification: async () => {},
  } as ServiceWorkerRegistration;

  return {
    registration,
    clients,
    controller,
    simulateMessage: (clientId: string, data: any) => {
      const client = clients.get(clientId);
      if (client) {
        client.simulateMessage(data);
      }
    },
    simulateClientMessage: (data: any) => {
      if (onMessageHandler) {
        const event = new MessageEvent("message", {
          data,
          source: Array.from(clients.values())[0] as any,
        });
        onMessageHandler(event);
      }
    },
  };
}

/**
 * Mock navigator.serviceWorker for testing
 */
export function createMockServiceWorkerNavigator(): {
  navigator: {
    serviceWorker: ServiceWorkerContainer;
  };
  clients: Map<string, MockServiceWorkerClient>;
  simulateMessage: (clientId: string, data: any) => void;
} {
  const clients = new Map<string, MockServiceWorkerClient>();
  let controller: ServiceWorker | null = null;
  let onMessageHandler: ((event: MessageEvent) => void) | null = null;
  let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

  const mockRegistration = createMockServiceWorkerRegistration();
  clients.set("default", mockRegistration.clients.get("default") || createMockServiceWorkerClient());

  const serviceWorkerContainer = {
    controller,
    ready: Promise.resolve(mockRegistration.registration),
    register: async (scriptURL: string | URL, options?: RegistrationOptions) => {
      registrationPromise = Promise.resolve(mockRegistration.registration);
      return registrationPromise;
    },
    getRegistration: async (scope?: string) => mockRegistration.registration,
    getRegistrations: async () => [mockRegistration.registration],
    startMessages: () => {},
    get oncontrollerchange() {
      return null;
    },
    set oncontrollerchange(_: ((event: Event) => void) | null) {},
    get onmessage() {
      return onMessageHandler;
    },
    set onmessage(handler: ((event: MessageEvent) => void) | null) {
      onMessageHandler = handler;
    },
    addEventListener: (type: string, listener: EventListener) => {},
    removeEventListener: (type: string, listener: EventListener) => {},
    dispatchEvent: (event: Event) => true,
  } as ServiceWorkerContainer;

  return {
    navigator: {
      serviceWorker: serviceWorkerContainer,
    } as any,
    clients,
    simulateMessage: (clientId: string, data: any) => {
      mockRegistration.simulateMessage(clientId, data);
    },
  };
}

/**
 * Create test binary data
 */
export function createTestData(size: number, pattern?: Uint8Array): Uint8Array {
  if (pattern) {
    const result = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      result[i] = pattern[i % pattern.length];
    }
    return result;
  }
  // Fill with sequential bytes for easy verification
  const result = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    result[i] = i % 256;
  }
  return result;
}
