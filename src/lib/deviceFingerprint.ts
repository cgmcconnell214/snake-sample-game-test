// Device fingerprinting and security utilities
interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  browserInfo: {
    userAgent: string;
    language: string;
    platform: string;
    cookieEnabled: boolean;
    doNotTrack: string;
    timezone: string;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
    };
    hardware: {
      cores: number;
      memory?: number;
    };
  };
}

// Generate a device fingerprint based on browser characteristics
export const generateDeviceFingerprint = (): DeviceInfo => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas fingerprinting
  let canvasFingerprint = '';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    canvasFingerprint = canvas.toDataURL();
  }

  // WebGL fingerprinting
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  let webglFingerprint = '';
  if (gl) {
    try {
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      webglFingerprint = `${vendor}-${renderer}`;
    } catch (e) {
      webglFingerprint = 'webgl-unavailable';
    }
  }

  // Audio context fingerprinting
  let audioFingerprint = '';
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    gainNode.gain.value = 0.05;
    
    oscillator.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    audioFingerprint = Array.from(dataArray).slice(0, 10).join('');
    
    oscillator.stop();
    audioContext.close();
  } catch (e) {
    audioFingerprint = 'audio-unavailable';
  }

  const browserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
    },
    hardware: {
      cores: navigator.hardwareConcurrency || 1,
      memory: (navigator as any).deviceMemory,
    },
  };

  // Create a comprehensive fingerprint
  const fingerprintData = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency,
    new Date().getTimezoneOffset(),
    canvasFingerprint.substring(0, 100),
    webglFingerprint,
    audioFingerprint,
  ].join('|');

  // Simple hash function for fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const fingerprint = Math.abs(hash).toString(36);
  
  // Generate a human-readable device name
  const deviceName = generateDeviceName(browserInfo);

  return {
    fingerprint,
    deviceName,
    browserInfo,
  };
};

// Generate a human-readable device name
const generateDeviceName = (browserInfo: DeviceInfo['browserInfo']): string => {
  const ua = browserInfo.userAgent;
  let deviceType = 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    if (/iPad/i.test(ua)) {
      deviceType = 'iPad';
    } else if (/iPhone/i.test(ua)) {
      deviceType = 'iPhone';
    } else if (/Android.*Mobile/i.test(ua)) {
      deviceType = 'Android Phone';
    } else if (/Android/i.test(ua)) {
      deviceType = 'Android Tablet';
    } else {
      deviceType = 'Mobile Device';
    }
  } else {
    deviceType = 'Desktop';
  }

  // Detect browser
  if (/Chrome/i.test(ua) && !/Edg|Edge/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Edg|Edge/i.test(ua)) {
    browser = 'Edge';
  } else if (/Opera|OPR/i.test(ua)) {
    browser = 'Opera';
  }

  // Detect OS
  if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Mac/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iOS|iPhone|iPad/i.test(ua)) {
    os = 'iOS';
  }

  return `${browser} on ${os} (${deviceType})`;
};

// Get geolocation if permission is granted
export const getLocationData = (): Promise<{ latitude?: number; longitude?: number; accuracy?: number }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        // Permission denied or error
        resolve({});
      },
      {
        timeout: 5000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Get IP information from a public service
export const getIPInfo = async (): Promise<{ ip?: string; country?: string; city?: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        country: data.country_name,
        city: data.city,
      };
    }
  } catch (error) {
    console.warn('Failed to get IP info:', error);
  }
  return {};
};