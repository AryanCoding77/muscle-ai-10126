import { Platform, NativeModules } from 'react-native';

// Soft flag for now; can be toggled to hard-block purchases later if needed
export const STRICT_INSTALLER_CHECK = false;

const VALID_INSTALLERS = ['com.android.vending', 'com.google.android.feedback'];

interface InstallerCheckResult {
  ok: boolean;
  installer?: string | null;
}

export async function checkInstaller(): Promise<InstallerCheckResult> {
  if (Platform.OS === 'ios') {
    return { ok: true, installer: 'ios' };
  }

  try {
    const { InstallerModule } = NativeModules as any;

    if (!InstallerModule || typeof InstallerModule.getInstallerPackage !== 'function') {
      console.log('⚠️ InstallerModule not available; cannot verify installer package');
      return { ok: false, installer: null };
    }

    const rawInstaller: string | null = await InstallerModule.getInstallerPackage();

    const isPlayStore = !!rawInstaller && VALID_INSTALLERS.includes(rawInstaller);

    return {
      ok: isPlayStore,
      installer: rawInstaller,
    };
  } catch (error) {
    console.error('❌ Error checking installer package from native module:', error);
    return { ok: false, installer: null };
  }
}
