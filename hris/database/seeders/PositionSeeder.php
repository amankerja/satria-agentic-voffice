<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $positions = [
            [
                'name' => 'Staff',
                'code' => 'STF',
                'level' => 1,
                'min_salary' => 5000000,
                'max_salary' => 8000000,
                'description' => 'Entry level position',
                'is_active' => true,
            ],
            [
                'name' => 'Senior Staff',
                'code' => 'SSTF',
                'level' => 2,
                'min_salary' => 8000000,
                'max_salary' => 12000000,
                'description' => 'Senior staff position',
                'is_active' => true,
            ],
            [
                'name' => 'Supervisor',
                'code' => 'SUPV',
                'level' => 3,
                'min_salary' => 12000000,
                'max_salary' => 18000000,
                'description' => 'Supervisor position',
                'is_active' => true,
            ],
            [
                'name' => 'Assistant Manager',
                'code' => 'AMGR',
                'level' => 4,
                'min_salary' => 18000000,
                'max_salary' => 25000000,
                'description' => 'Assistant Manager position',
                'is_active' => true,
            ],
            [
                'name' => 'Manager',
                'code' => 'MGR',
                'level' => 5,
                'min_salary' => 25000000,
                'max_salary' => 35000000,
                'description' => 'Manager position',
                'is_active' => true,
            ],
            [
                'name' => 'Senior Manager',
                'code' => 'SMGR',
                'level' => 6,
                'min_salary' => 35000000,
                'max_salary' => 50000000,
                'description' => 'Senior Manager position',
                'is_active' => true,
            ],
            [
                'name' => 'Director',
                'code' => 'DIR',
                'level' => 7,
                'min_salary' => 50000000,
                'max_salary' => 100000000,
                'description' => 'Director position',
                'is_active' => true,
            ],
        ];

        foreach ($positions as $pos) {
            Position::create($pos);
        }
    }
}