package com.UserService.User.dto;

import com.UserService.User.model.User;
import lombok.Data;

/**
 * Read-only projection of a User returned to API consumers.
 * Never exposes the password hash.
 */
@Data
public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private User.Role role;
    private User.KycStatus kycStatus;
    private Boolean isActive;
}
