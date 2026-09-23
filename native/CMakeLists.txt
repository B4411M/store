# B41M HEN STORE - Native PS4 Application
# CMake build configuration

cmake_minimum_required(VERSION 3.10)
project(B41M_HEN_STORE C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Platform detection
if(ORBIS)
    message(STATUS "Building for PS4 (Orbis)")
    set(PS4_BUILD ON)
else()
    message(STATUS "Building for host (testing)")
    set(PS4_BUILD OFF)
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/main.c
    src/http_client.c
    src/json_parser.c
    src/download_manager.c
    src/sha256.c
    src/storage_manager.c
    src/pkg_installer.c
    src/ui/webview.c
    src/ui/input.c
    src/ui/render.c
    src/utils/log.c
    src/utils/config.c
)

# External dependencies
# For PS4: link against liborbis, libcurl, mbedtls, etc.
# For host: link against system libraries

if(PS4_BUILD)
    # PS4 specific libraries
    find_library(ORBIS_LIB orbis)
    find_library(CURL_LIB curl)
    find_library(MBEDTLS_LIB mbedtls)
    find_library(MBEDX509_LIB mbedx509)
    find_library(MBEDCRYPTO_LIB mbedcrypto)
    
    set(EXTRA_LIBS ${ORBIS_LIB} ${CURL_LIB} ${MBEDTLS_LIB} ${MBEDX509_LIB} ${MBEDCRYPTO_LIB})
else()
    # Host libraries for testing
    find_package(CURL REQUIRED)
    find_package(OpenSSL REQUIRED)
    
    set(EXTRA_LIBS ${CURL_LIBRARIES} ${OPENSSL_LIBRARIES})
endif()

# Add executable
add_executable(b41m_hen_store ${SOURCES})
target_link_libraries(b41m_hen_store ${EXTRA_LIBS})

# PS4 specific settings
if(PS4_BUILD)
    set_target_properties(b41m_hen_store PROPERTIES
        OUTPUT_NAME "eboot.bin"
        SUFFIX ""
    )
    
    # Add custom command to create PKG
    add_custom_command(TARGET b41m_hen_store POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E echo "Build complete. Run orbis-pub-gen to create PKG."
        COMMENT "Creating PKG..."
    )
endif()

# Install target
install(TARGETS b41m_hen_store DESTINATION bin)