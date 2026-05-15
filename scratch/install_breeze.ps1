$phpPath = "F:\laragon\bin\php\php-8.3.30-Win32-vs16-x64"
$composerPath = "F:\laragon\bin\composer"
$env:PATH = "$phpPath;$composerPath;" + $env:PATH
cd "F:\Projek Vibe Koding\pbb-app-laravel\web-laravel"
php artisan breeze:install react --dark --typescript --eslint --no-interaction
