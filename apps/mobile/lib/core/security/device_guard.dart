import 'dart:io';

class DeviceGuard {
  static Future<bool> isDeviceCompromised() async {
    // Check common root/su binary paths on Android
    if (Platform.isAndroid) {
      const paths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
      ];
      for (final path in paths) {
        if (File(path).existsSync()) {
          return true; // Root detected
        }
      }
    }
    return false;
  }

  static String generateDeviceFingerprint() {
    return 'DEVICE_${Platform.operatingSystem}_${Platform.operatingSystemVersion.hashCode}';
  }
}
