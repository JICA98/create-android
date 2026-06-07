plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.hilt)
}

android {
    namespace = "{{package}}.feature.home"
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
    implementation(project(":core:designsystem"))
    implementation(project(":core:data"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.hilt.android)
}
