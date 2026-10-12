package com.UserService.User.service;

import com.UserService.User.dto.*;
import com.UserService.User.model.User;

import java.util.List;

/**
 * Contract for user account and authentication operations.
 */
public interface UserService {

    /** Register a new user account (U-1). */
    UserProfileResponse register(RegisterRequest request);

    /** Authenticate via email + password and return a JWT (U-1). */
    AuthResponse login(LoginRequest request);

    /** Fetch the profile of the currently authenticated user (U-2). */
    UserProfileResponse getProfile(Long userId);

    /** Update profile fields (name, phone) for the given user (U-2). */
    UserProfileResponse updateProfile(Long userId, RegisterRequest request);

    /** Suspend or reactivate an account (A-2). */
    void setActiveStatus(Long userId, boolean active);

    /** List all registered users (admin only, A-2). */
    List<UserProfileResponse> listAllUsers();
}
