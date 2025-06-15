<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MakeDto extends Command
{
    protected $signature = 'make:dto {name}';
    protected $description = 'Create a new DTO class';

    public function handle()
    {
        $name = $this->argument('name');
        $dtoPath = app_path("DTOs/{$name}Data.php");

        if (File::exists($dtoPath)) {
            $this->error('DTO already exists!');
            return;
        }

        if (!File::exists(app_path('DTOs'))) {
            File::makeDirectory(app_path('DTOs'));
        }

        $stub = <<<EOT
<?php

namespace App\DTOs;

class {$name}Data
{
    /**
     * Sample data
     */
     private ?string \$phone;

    public function __construct(array \$data)
    {
        \$this->phone = \$data['phone'] ?? null;
    }

    /**
     * Get the value of phone
     */
    public function getPhone(): ?string
    {
        return \$this->phone;
    }
}
EOT;

        File::put($dtoPath, $stub);
        $this->info("DTO {$name} created successfully.");
    }
}
