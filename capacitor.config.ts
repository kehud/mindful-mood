/// <reference types="@capacitor/splash-screen" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.mindful.mood',
  appName: 'Reflect',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 350,
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    }
  }
};

export default config;
