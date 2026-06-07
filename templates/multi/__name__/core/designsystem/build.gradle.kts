plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "{{package}}.designsystem"
    compileSdk = {{compileSdk}}
    defaultConfig { minSdk = {{minSdk}} }
    buildFeatures { compose = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    api(platform(libs.compose.bom))
    api(libs.compose.ui)
}
