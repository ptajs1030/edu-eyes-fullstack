# Base image with PHP and Node
FROM php:8.3-fpm-bookworm AS base

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    libicu-dev \
    libxml2-dev \
    libxslt1-dev \
    nodejs \
    npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working dir
WORKDIR /var/www

# Copy app files
COPY . .

# Install PHP and JS dependencies
RUN composer install --no-interaction --prefer-dist && \
    npm install && \
    npm run build && \
    chown -R www-data:www-data /var/www

# Laravel specific: give storage and bootstrap permission
RUN chmod -R 775 storage bootstrap/cache

USER www-data