<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class RegisterController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // El modelo aplica el cast 'hashed' a password: no usar Hash::make aquí (evita doble hash).
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $token = $user->createToken('lw-spa', ['*'], now()->addDays(90))->plainTextToken;

        return $this->success([
            'user' => new UserResource($user),
            'token' => $token,
            'business' => null,
        ], 'Usuario registrado', 201);
    }
}
