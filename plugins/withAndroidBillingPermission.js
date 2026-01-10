const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Adds Google Play Billing permission to AndroidManifest.xml
 * and forces Google Play Billing Library 6.2.1 in build.gradle
 */
const withAndroidBillingPermission = (config) => {
  // Step 1: Add BILLING permission to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest;

    if (!mainApplication['uses-permission']) {
      mainApplication['uses-permission'] = [];
    }

    const billingPermission = {
      $: {
        'android:name': 'com.android.vending.BILLING',
      },
    };

    const hasBillingPermission = mainApplication['uses-permission'].some(
      (permission) => permission.$['android:name'] === 'com.android.vending.BILLING'
    );

    if (!hasBillingPermission) {
      mainApplication['uses-permission'].push(billingPermission);
      console.log('✅ Added BILLING permission to AndroidManifest.xml');
    }

    return config;
  });

  // Step 2: Add Google Play Billing Library 6.2.1 to app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    
    // Add missingDimensionStrategy for 'store' dimension (CRITICAL for Play Billing)
    if (!buildGradle.includes("missingDimensionStrategy 'store'")) {
      const defaultConfigPattern = /defaultConfig\s*{/;
      
      if (defaultConfigPattern.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          defaultConfigPattern,
          `defaultConfig {\n        // Required for Google Play Billing Library\n        missingDimensionStrategy 'store', 'play'`
        );
        console.log('✅ Added missingDimensionStrategy for Play Store to build.gradle');
      }
    }
    
    if (buildGradle.includes('com.android.billingclient:billing:')) {
      // Replace existing billing library version with 6.2.1
      buildGradle = buildGradle.replace(
        /implementation\s+['"]com\.android\.billingclient:billing:[^'"]+['"]/g,
        "implementation 'com.android.billingclient:billing:6.2.1'"
      );
      console.log('✅ Updated Billing Library to 6.2.1 in build.gradle');
    } else {
      // Add billing library to dependencies block
      const dependenciesPattern = /dependencies\s*{/;
      
      if (dependenciesPattern.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          dependenciesPattern,
          `dependencies {\n    // Google Play Billing Library 6.2.1 (required for Play Console compliance)\n    implementation 'com.android.billingclient:billing:6.2.1'`
        );
        console.log('✅ Added Billing Library 6.2.1 to build.gradle');
      }
    }

    config.modResults.contents = buildGradle;
    return config;
  });

  return config;
};

module.exports = withAndroidBillingPermission;
