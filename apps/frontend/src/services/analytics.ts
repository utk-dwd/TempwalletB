// src/services/analytics.ts
import mixpanel from 'mixpanel-browser';
import { UserProperties, EventName, Properties } from '../utils/types';

const mixpanelToken =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_MIXPANEL_TOKEN
    : import.meta.env.VITE_MIXPANEL_TOKEN_DEV;

const isDevelopment = import.meta.env.MODE !== 'production';

// Type guard to check if the token is valid
if (!mixpanelToken) {
  console.error(
    'Mixpanel token is not configured. Please check your .env file for VITE_MIXPANEL_TOKEN or VITE_MIXPANEL_TOKEN_DEV.'
  );
}

const analyticsService = {
  init: () => {
    if (mixpanelToken) {
      mixpanel.init(mixpanelToken, {
        debug: isDevelopment, // Enable debug mode in development
        track_pageview: true, // Automatically track page views
        persistence: 'localStorage',
      });
      console.log('Mixpanel initialized in', import.meta.env.MODE, 'mode.');
    }
  },

  identifyUser: (userId: string, properties: UserProperties) => {
    if (mixpanelToken) {
      mixpanel.identify(userId);
      mixpanel.people.set(properties);
    }
  },

  trackEvent: (eventName: EventName, properties?: Properties) => {
    if (mixpanelToken) {
      mixpanel.track(eventName, properties);
    }
  },

  registerSuperProperties: (properties: Properties) => {
    if (mixpanelToken) {
      mixpanel.register(properties);
    }
  },
  
  reset: () => {
    if (mixpanelToken) {
      mixpanel.reset();
    }
  },
  identify(userId: string): void {
    if (mixpanelToken) {
      console.log('Identifying user:', userId);
      mixpanel.identify(userId);
    }
  },
  setPeople(properties: Record<string, any>): void {
    if (mixpanelToken) {
      console.log('Setting people properties:', properties);
      mixpanel.people.set(properties);
    }
  },
};

export default analyticsService;