<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@hris.local',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        // Create HR Manager
        User::create([
            'name' => 'HR Manager',
            'email' => 'hr@hris.local',
            'password' => Hash::make('password123'),
            'role' => 'hr_manager',
            'email_verified_at' => now(),
        ]);

        // Create Department Manager
        User::create([
            'name' => 'IT Manager',
            'email' => 'it.manager@hris.local',
            'password' => Hash::make('password123'),
            'role' => 'department_manager',
            'email_verified_at' => now(),
        ]);

        // Create Employee
        User::create([
            'name' => 'John Doe',
            'email' => 'john.doe@hris.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'email_verified_at' => now(),
        ]);
    }
}