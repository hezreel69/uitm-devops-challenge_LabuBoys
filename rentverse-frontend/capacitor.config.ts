import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentverseclarity.app',
  appName: 'Rentverse by ClaRity',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  server: {
    // For production, load from Vercel deployment
    url: 'https://rentverse-frontend-nine.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      // Fade out animation
      launchFadeOutDuration: 500,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
