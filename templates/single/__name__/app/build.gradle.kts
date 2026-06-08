import java.util.Properties

plugins {
    id("com.android.application")
}

android {
    namespace = "{{package}}"
    compileSdk = {{compileSdk}}
    defaultConfig {
        applicationId = "{{package}}"
        minSdk = {{minSdk}}
        targetSdk = {{targetSdk}}
        versionCode = 1
        versionName = "1.0"
    }
    signingConfigs {
        create("release") {
            val localProps = Properties()
            val localPropsFile = rootProject.file("local.properties")
            if (localPropsFile.exists()) {
                localProps.load(localPropsFile.inputStream())
                keyAlias = localProps.getProperty("signing.keyAlias")
                keyPassword = localProps.getProperty("signing.keyPassword")
                storeFile = rootProject.file(localProps.getProperty("signing.storeFile"))
                storePassword = localProps.getProperty("signing.storePassword")
            }
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
