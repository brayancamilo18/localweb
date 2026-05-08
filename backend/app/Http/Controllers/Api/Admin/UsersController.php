<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsersController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'string', 'max:120'],
            'has_business' => ['sometimes', 'boolean'],
            'email_verified' => ['sometimes', 'boolean'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);

        $query = User::query()
            ->with(['business' => fn ($q) => $q->withTrashed()]);

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('users.name', 'like', $term)
                    ->orWhere('users.email', 'like', $term);
            });
        }

        if ($request->has('has_business')) {
            if ($request->boolean('has_business')) {
                $query->whereNotNull('users.business_id');
            } else {
                $query->whereNull('users.business_id');
            }
        }

        if ($request->has('email_verified')) {
            if ($request->boolean('email_verified')) {
                $query->whereNotNull('users.email_verified_at');
            } else {
                $query->whereNull('users.email_verified_at');
            }
        }

        $query->orderByDesc('users.created_at');

        $paginator = $query->paginate($perPage)->withQueryString();

        return $this->success([
            'items' => AdminUserResource::collection($paginator->items())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function resendVerification(User $user): JsonResponse
    {
        if ($user->hasVerifiedEmail()) {
            return $this->error('El correo ya está verificado.', [], 422);
        }

        $user->sendEmailVerificationNotification();

        return $this->success(['resent' => true]);
    }
}
