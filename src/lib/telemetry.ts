import { ApplicationInsights } from '@microsoft/applicationinsights-web';

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
  window.addEventListener('error', (event) => {
    appInsights.trackException({ 
      exception: event.error,
      severityLevel: 3 
    });
  });

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    appInsights.trackException({ 
      exception: new Error(event.reason),
      severityLevel: 3 
    });
  });
}

export const telemetry = {
  trackEvent: (name: string, properties?: Record<string, any>) => {
    appInsights.trackEvent({ name }, properties);
  },

  trackDependency: (name: string, data: string, duration: number, success: boolean) => {
    appInsights.trackDependency({
      target: name,
      name: data,
      duration,
      success,
      responseCode: success ? 200 : 500,
    });
  },

  trackError: (error: Error, properties?: Record<string, any>) => {
    appInsights.trackException({ 
      exception: error,
      severityLevel: 3
    }, properties);
  },

  trackUserAction: (action: string, data?: Record<string, any>) => {
    appInsights.trackEvent({ name: `UserAction_${action}` }, data);
  },

  trackMetric: (name: string, average: number, properties?: Record<string, any>) => {
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

  stopTrackPage: (name?: string, url?: string, customProperties?: Record<string, any>) => {
    appInsights.stopTrackPage(name, url, customProperties);
  },
};

export { appInsights };