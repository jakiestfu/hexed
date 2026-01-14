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
 * Create a mock Worker
 */
export function createMockWorker(
  url: string | URL
): {
  worker: Worker;
  messages: Array<{ data: any; transfer?: Transferable[] }>;
  simulateMessage: (data: any) => void;
} {
  const messages: Array<{ data: any; transfer?: Transferable[] }> = [];
  let onMessageHandler: ((event: MessageEvent) => void) | null = null;
  let onErrorHandler: ((event: ErrorEvent) => void) | null = null;

  const worker = {
    postMessage(data: any, transfer?: Transferable[]): void {
      messages.push({ data, transfer });
    },
    terminate(): void {
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
  } as unknown as Worker;

  return {
    worker,
    messages,
    simulateMessage: (data: any) => {
      if (onMessageHandler) {
        const event = new MessageEvent("message", { data });
        onMessageHandler(event);
      }
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
