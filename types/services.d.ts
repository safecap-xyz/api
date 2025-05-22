/**
 * Type declarations for service modules to help TypeScript find them
 * when using .js extension imports with NodeNext module resolution
 */

declare module '../services/openaiService.js' {
  export const openaiService: {
    initialize: () => void;
    [key: string]: any;
  };
}

declare module '../services/agentKitService.js' {
  export const agentKitService: {
    [key: string]: any;
  };
}

declare module '../services/mastraService.js' {
  export const mastraService: {
    [key: string]: any;
  };
}
