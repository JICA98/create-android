plugins {
    `kotlin-dsl`
}

dependencies {
    compileOnly(libs.android.gradle.plugin)
    compileOnly(libs.kotlin.gradle.plugin)
    compileOnly(libs.compose.gradle.plugin)
}

gradlePlugin {
    plugins {
        register("androidApplication") {
            id = "android.application.flux"
            implementationClass = "com.flux.AndroidApplicationConventionPlugin"
        }
    }
}
