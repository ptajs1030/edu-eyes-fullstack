<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MakeService extends Command
{
    protected $signature = 'make:service {name}';
    protected $description = 'Create a new Service class';

    public function handle()
    {
        $name = $this->argument('name');
        $servicePath = app_path("Services/{$name}Service.php");

        if (File::exists($servicePath)) {
            $this->error('Service already exists!');
            return;
        }

        if (!File::exists(app_path('Services'))) {
            File::makeDirectory(app_path('Services'));
        }

        $stub = <<<EOT
<?php

namespace App\Services;

class {$name}Service
{
    // Berisi tetang logic aplikasimu
}
EOT;

        File::put($servicePath, $stub);
        $this->info("Service {$name} created successfully.");
    }
}
