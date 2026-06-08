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
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
