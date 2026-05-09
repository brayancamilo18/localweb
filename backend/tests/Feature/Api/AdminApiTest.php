<?php

use App\Models\Business;
use App\Models\PageVisit;
use App\Models\Template;
use App\Models\User;
use Carbon\Carbon;
use App\Notifications\VerifyEmailEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('admin ping without token returns 401', function () {
    test()->getJson('/api/v1/admin/ping')->assertStatus(401);
});

it('admin ping with non-admin token returns 403', function () {
    $user = User::factory()->create(['is_admin' => false]);
    test()->actingAs($user)
        ->getJson('/api/v1/admin/ping')
        ->assertStatus(403);
});

it('admin ping with admin token returns ok', function () {
    $user = User::factory()->create(['is_admin' => true]);
    test()->actingAs($user)
        ->getJson('/api/v1/admin/ping')
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);
});

it('admin stats overview forbids non-admin', function () {
    $user = User::factory()->create(['is_admin' => false]);
    test()->actingAs($user)
        ->getJson('/api/v1/admin/stats/overview')
        ->assertStatus(403);
});

it('admin stats overview returns aggregates', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    Business::create([
        'name' => 'Pro Pub',
        'subdomain' => 'adm-pro-pub-aaaa',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'is_published' => true,
    ]);
    Business::create([
        'name' => 'Free Draft',
        'subdomain' => 'adm-free-dr-bbbb',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);

    test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/overview')
        ->assertStatus(200)
        ->assertJsonPath('data.total_businesses', 2)
        ->assertJsonPath('data.total_published', 1)
        ->assertJsonPath('data.total_unpublished', 1)
        ->assertJsonPath('data.total_users', 1)
        ->assertJsonPath('data.plan_breakdown.pro', 1)
        ->assertJsonPath('data.plan_breakdown.free', 1)
        ->assertJsonPath('data.plan_breakdown.pending', 0)
        ->assertJsonPath('data.conversion_rate', 50)
        ->assertJsonPath('data.new_businesses_last_30d', 2)
        ->assertJsonPath('data.total_visits_last_30d', 0);
});

it('admin stats sectors lists all configured sectors ordered by total', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $expectedCount = count(config('sectors', []));

    Business::create([
        'name' => 'Pelu A',
        'subdomain' => 'sec-pelu-a-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'peluqueria',
        'plan' => 'free',
        'is_published' => true,
    ]);
    Business::create([
        'name' => 'Pelu B',
        'subdomain' => 'sec-pelu-b-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'peluqueria',
        'plan' => 'pro',
        'is_published' => true,
    ]);
    Business::create([
        'name' => 'Otro',
        'subdomain' => 'sec-otro-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'is_published' => false,
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/sectors')
        ->assertStatus(200);

    $sectors = $response->json('data.sectors');
    expect($sectors)->toHaveCount($expectedCount);

    $pelu = collect($sectors)->firstWhere('sector', 'peluqueria');
    expect($pelu['total'])->toBe(2)
        ->and($pelu['published'])->toBe(2)
        ->and($pelu['free'])->toBe(1)
        ->and($pelu['pro'])->toBe(1);

    expect($sectors[0]['sector'])->toBe('peluqueria')
        ->and($sectors[1]['sector'])->toBe('otros');
});

it('admin stats templates lists all templates with usage ordered desc', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $hiUse = Template::create([
        'name' => 'High use',
        'slug' => 'hi-use-'.uniqid(),
        'primary_color' => '#111111',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $lowUse = Template::create([
        'name' => 'Low use',
        'slug' => 'low-use-'.uniqid(),
        'primary_color' => '#222222',
        'is_active' => false,
        'requires_pro' => true,
    ]);

    foreach (range(1, 3) as $_) {
        Business::create([
            'name' => 'Biz '.$_,
            'subdomain' => 'tpl-hi-'.$_.'-'.uniqid(),
            'subdomain_type' => 'random',
            'sector' => 'otros',
            'template_id' => $hiUse->id,
            'plan' => 'free',
            'is_published' => true,
        ]);
    }
    Business::create([
        'name' => 'Biz low',
        'subdomain' => 'tpl-low-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'template_id' => $lowUse->id,
        'plan' => 'free',
        'is_published' => true,
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/templates')
        ->assertStatus(200);

    $list = $response->json('data.templates');
    expect($list[0]['slug'])->toBe($hiUse->slug)
        ->and($list[0]['total_usage'])->toBe(3)
        ->and($list[0]['is_active'])->toBeTrue()
        ->and($list[0])->toHaveKeys(['id', 'name', 'slug', 'is_active', 'requires_pro', 'total_usage']);

    $lowRow = collect($list)->firstWhere('slug', $lowUse->slug);
    expect($lowRow['total_usage'])->toBe(1)
        ->and($lowRow['is_active'])->toBeFalse()
        ->and($lowRow['requires_pro'])->toBeTrue();
});

it('admin stats top-pages returns published businesses ordered by filter', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $hot = Business::create([
        'name' => 'Hot',
        'subdomain' => 'top-hot-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);
    $cold = Business::create([
        'name' => 'Cold',
        'subdomain' => 'top-cold-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);

    Business::create([
        'name' => 'Draft',
        'subdomain' => 'top-draft-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);

    foreach (range(1, 5) as $_) {
        PageVisit::create([
            'business_id' => $hot->id,
            'event_type' => 'visit',
            'visited_at' => now(),
        ]);
    }
    PageVisit::create([
        'business_id' => $cold->id,
        'event_type' => 'visit',
        'visited_at' => now(),
    ]);
    PageVisit::create([
        'business_id' => $cold->id,
        'event_type' => 'whatsapp_click',
        'visited_at' => now(),
    ]);

    $pages = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/top-pages?event_type=visit&limit=10')
        ->assertStatus(200)
        ->json('data.pages');

    expect($pages[0]['business_id'])->toBe($hot->id)
        ->and($pages[0]['visits'])->toBe(5)
        ->and($pages[0])->toHaveKeys(['business_id', 'name', 'subdomain', 'sector', 'plan', 'visits', 'whatsapp_clicks', 'phone_clicks']);

    $wa = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/top-pages?event_type=whatsapp_click')
        ->json('data.pages');

    expect($wa[0]['business_id'])->toBe($cold->id)
        ->and($wa[0]['whatsapp_clicks'])->toBe(1);
});

it('admin stats top-pages rejects invalid query params', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/top-pages?range=nope')
        ->assertStatus(422);
});

it('admin stats timeseries requires metric', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/timeseries')
        ->assertStatus(422);
});

it('admin stats timeseries registrations fills daily gaps', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    Business::create([
        'name' => 'Ts Reg',
        'subdomain' => 'ts-reg-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'created_at' => Carbon::now()->subDays(3),
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/timeseries?metric=registrations&range=7d&granularity=day')
        ->assertStatus(200);

    expect($response->json('data.granularity'))->toBe('day');
    $points = $response->json('data.points');
    expect($points)->toHaveCount(7);
    expect(collect($points)->sum('value'))->toBe(1);
});

it('admin stats timeseries visits uses page_visits', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $b = Business::create([
        'name' => 'Ts Visit',
        'subdomain' => 'ts-vis-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    PageVisit::create([
        'business_id' => $b->id,
        'event_type' => 'visit',
        'visited_at' => Carbon::now(),
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/timeseries?metric=visits&range=7d&granularity=day')
        ->assertStatus(200);

    expect(collect($response->json('data.points'))->sum('value'))->toBe(1);
});

it('admin stats timeseries defaults granularity by range', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $r90 = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/timeseries?metric=registrations&range=90d')
        ->assertStatus(200)
        ->json('data.granularity');

    expect($r90)->toBe('week');

    $r365 = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/timeseries?metric=registrations&range=365d')
        ->json('data.granularity');

    expect($r365)->toBe('month');
});

it('admin templates index lists all with usage like stats templates', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $hiUse = Template::create([
        'name' => 'Admin hi',
        'slug' => 'adm-hi-'.uniqid(),
        'primary_color' => '#111111',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $inactive = Template::create([
        'name' => 'Admin off',
        'slug' => 'adm-off-'.uniqid(),
        'primary_color' => '#222222',
        'is_active' => false,
        'requires_pro' => true,
    ]);

    foreach (range(1, 2) as $_) {
        Business::create([
            'name' => 'Biz '.$_,
            'subdomain' => 'adm-tpl-hi-'.$_.'-'.uniqid(),
            'subdomain_type' => 'random',
            'sector' => 'otros',
            'template_id' => $hiUse->id,
            'plan' => 'free',
            'is_published' => true,
        ]);
    }

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/templates')
        ->assertStatus(200);

    $list = $response->json('data.templates');
    $first = collect($list)->firstWhere('slug', $hiUse->slug);
    $second = collect($list)->firstWhere('slug', $inactive->slug);

    expect($first['total_usage'])->toBe(2)
        ->and($first['is_active'])->toBeTrue()
        ->and($second['total_usage'])->toBe(0)
        ->and($second['is_active'])->toBeFalse()
        ->and($second['requires_pro'])->toBeTrue()
        ->and($first)->toHaveKeys(['id', 'name', 'slug', 'primary_color', 'is_active', 'requires_pro', 'total_usage']);
});

it('admin templates toggle-active returns updated template', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $tpl = Template::create([
        'name' => 'Toggle act',
        'slug' => 'tog-act-'.uniqid(),
        'primary_color' => '#333',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $response = test()->actingAs($admin)
        ->patchJson("/api/v1/admin/templates/{$tpl->id}/toggle-active")
        ->assertStatus(200);

    expect($response->json('data.template.is_active'))->toBeFalse();

    $tpl->refresh();
    expect($tpl->is_active)->toBeFalse();
});

it('admin users index paginates with search and filters', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $biz = Business::create([
        'name' => 'Linked Co',
        'subdomain' => 'adm-u-biz-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);

    User::factory()->create([
        'name' => 'Alice Searchable',
        'email' => 'alice-find@test.example',
        'business_id' => $biz->id,
        'email_verified_at' => now(),
        'is_admin' => false,
    ]);
    User::factory()->unverified()->create([
        'name' => 'Bob NoBiz',
        'email' => 'bob@test.example',
        'business_id' => null,
        'is_admin' => false,
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/users?search=alice-find&has_business=1&email_verified=1')
        ->assertStatus(200);

    expect($response->json('data.pagination.total'))->toBe(1);
    $item = $response->json('data.items.0');
    expect($item['email'])->toBe('alice-find@test.example')
        ->and($item['business']['subdomain'])->toBe($biz->subdomain)
        ->and($item['email_verified_at'])->not->toBeNull();

    $noBiz = test()->actingAs($admin)
        ->getJson('/api/v1/admin/users?has_business=0&email_verified=0')
        ->assertStatus(200);

    expect($noBiz->json('data.pagination.total'))->toBe(1)
        ->and($noBiz->json('data.items.0.email'))->toBe('bob@test.example')
        ->and($noBiz->json('data.items.0.business'))->toBeNull();
});

it('admin users resend verification sends notification when unverified', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $target = User::factory()->unverified()->create([
        'name' => 'Unverified',
        'email' => 'need-verify@test.example',
        'is_admin' => false,
    ]);

    test()->actingAs($admin)
        ->postJson("/api/v1/admin/users/{$target->id}/resend-verification")
        ->assertStatus(200)
        ->assertJsonPath('data.resent', true);

    Notification::assertSentTo($target, VerifyEmailEs::class);
});

it('admin users pagination supports page parameter', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    User::factory()->create([
        'email' => 'older-pagination@test.example',
        'created_at' => now()->subDays(5),
    ]);

    $r2 = test()->actingAs($admin)
        ->getJson('/api/v1/admin/users?per_page=1&page=2')
        ->assertStatus(200);

    expect($r2->json('data.pagination.total'))->toBe(2)
        ->and(count($r2->json('data.items')))->toBe(1)
        ->and($r2->json('data.items.0.email'))->toBe('older-pagination@test.example');
});

it('admin stats top-pages returns at most limit rows', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/stats/top-pages?limit=50&range=all&event_type=visit')
        ->assertStatus(200);

    expect(count($response->json('data.pages')))->toBeLessThanOrEqual(50);
});

it('admin users resend verification rejects when already verified', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $target = User::factory()->create([
        'email_verified_at' => now(),
        'is_admin' => false,
    ]);

    test()->actingAs($admin)
        ->postJson("/api/v1/admin/users/{$target->id}/resend-verification")
        ->assertStatus(422);

    Notification::assertNothingSent();
});

it('admin templates toggle-pro returns updated template', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $tpl = Template::create([
        'name' => 'Toggle pro',
        'slug' => 'tog-pro-'.uniqid(),
        'primary_color' => '#444',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $response = test()->actingAs($admin)
        ->patchJson("/api/v1/admin/templates/{$tpl->id}/toggle-pro")
        ->assertStatus(200);

    expect($response->json('data.template.requires_pro'))->toBeTrue()
        ->and($response->json('data.template.total_usage'))->toBe(0);
});
