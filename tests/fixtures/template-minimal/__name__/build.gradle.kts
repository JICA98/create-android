plugins {
    id("com.android.application")
}

android {
    namespace = "{{package}}"
    compileSdk = {{compileSdk}}
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.0")
}
