import { ApplicationInsights, type ICustomProperties, type IDependencyTelemetry } from '@microsoft/applicationinsights-web';

type TelemetryProperties = ICustomProperties;

const createDependencyTelemetry = (
  target: string,
  name: string,
  duration: number,
  success: boolean
): IDependencyTelemetry => ({
  id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `dep_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  target,
  name,
  duration,
  success,
  responseCode: success ? 200 : 500,
  type: 'HTTP'
});

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableCorsCorrelation: true,
    distributedTracingMode: 2, // W3C Distributed Tracing
    disableExceptionTracking: false, // Still tracks unhandled errors
    autoTrackPageVisitTime: true,
    enableUnhandledPromiseRejectionTracking: true,
  }
});

// Initialize only if connection string is provided
if (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING) {
  appInsights.loadAppInsights();
  appInsights.trackPageView();
  
  // Global error handler
  window.addEventListener('error', (event: ErrorEvent) => {
    appInsights.trackException({ 
      exception: event.error,
      severityLevel: 3 
    });
  });

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason instanceof Error
      ? event.reason
      : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled rejection');

    appInsights.trackException({ 
      exception: reason,
      severityLevel: 3 
    });
  });
}

export const telemetry = {
  trackEvent: (name: string, properties?: TelemetryProperties) => {
    appInsights.trackEvent({ name }, properties);
  },

  trackDependency: (
    target: string,
    name: string,
    duration: number,
    success: boolean
  ) => {
    appInsights.trackDependencyData(createDependencyTelemetry(target, name, duration, success));
  },

  trackError: (error: Error, properties?: TelemetryProperties) => {
    appInsights.trackException({ 
      exception: error,
      severityLevel: 3
    }, properties);
  },

  trackUserAction: (action: string, data?: TelemetryProperties) => {
    appInsights.trackEvent({ name: `UserAction_${action}` }, data);
  },

  trackMetric: (name: string, average: number, properties?: TelemetryProperties) => {
    appInsights.trackMetric({ name, average }, properties);
  },

  trackPageView: (name?: string, uri?: string) => {
    appInsights.trackPageView({ name, uri });
  },

  setUser: (userId: string, accountId?: string) => {
    appInsights.setAuthenticatedUserContext(userId, accountId);
  },

  clearUser: () => {
    appInsights.clearAuthenticatedUserContext();
  },

  startTrackPage: (name?: string) => {
    appInsights.startTrackPage(name);
  },

  stopTrackPage: (name?: string, url?: string, customProperties?: TelemetryProperties) => {
    appInsights.stopTrackPage(name, url, customProperties);
  },
};

export { appInsights };