plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt)
}

android {
    namespace = "{{package}}.data"
    compileSdk = {{compileSdk}}
    defaultConfig { minSdk = {{minSdk}} }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.hilt.android)
}
