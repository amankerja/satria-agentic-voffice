<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;

class LeaveTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Cuti Tahunan',
                'code' => 'ANNUAL',
                'max_days_per_year' => 12,
                'is_paid' => true,
                'requires_attachment' => false,
                'description' => 'Cuti tahunan berhak 12 hari per tahun',
                'is_active' => true,
            ],
            [
                'name' => 'Cuti Sakit',
                'code' => 'SICK',
                'max_days_per_year' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'description' => 'Cuti sakit dengan surat dokter',
                'is_active' => true,
            ],
            [
                'name' => 'Cuti Melahirkan',
                'code' => 'MATERNITY',
                'max_days_per_year' => 90,
                'is_paid' => true,
                'requires_attachment' => true,
                'description' => 'Cuti melahirkan 90 hari (sebelum dan sesudah melahirkan)',
                'is_active' => true,
            ],
            [
                'name' => 'Cuti Alasan Penting',
                'code' => 'IMPORTANT',
                'max_days_per_year' => 2,
                'is_paid' => true,
                'requires_attachment' => false,
                'description' => 'Cuti alasan penting (menikah, mengkhitanan anak, dll) 2 hari per tahun',
                'is_active' => true,
            ],
            [
                'name' => 'Cuti di Luar Tanggungan',
                'code' => 'UNPAID',
                'max_days_per_year' => null,
                'is_paid' => false,
                'requires_attachment' => false,
                'description' => 'Cuti tanpa gaji',
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $type) {
            LeaveType::create($type);
        }
    }
}